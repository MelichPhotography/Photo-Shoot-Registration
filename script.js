fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;

    const playerInfoContainer = document.getElementById('playerInfo');
    const orderFormContainer = document.getElementById('orderForm');

    // --- GENERATE FORM FIELDS ---
    config.fields.forEach(field => {
      if (field.type !== 'order') {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '12px';
        label.innerText = field.label;

        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.code;
        if (field.required) input.required = true;
        label.appendChild(input);

        playerInfoContainer.appendChild(label);
        return;
      }

      // Order groups
      if (field.groups) {
        field.groups.forEach(group => {
          const groupHeader = document.createElement('div');
          groupHeader.classList.add('group-header');
          groupHeader.innerText = group.name;
          orderFormContainer.appendChild(groupHeader);

          if (group.subSections) {
            group.subSections.forEach(sub => {
              const subHeader = document.createElement('div');
              subHeader.classList.add('sub-section-header');
              subHeader.innerText = sub.name;
              orderFormContainer.appendChild(subHeader);

              if (sub.note) {
                const noteEl = document.createElement('div');
                noteEl.classList.add('sub-section-note');
                noteEl.innerText = sub.note;
                orderFormContainer.appendChild(noteEl);
              }

              sub.options.forEach(option => {
                const container = document.createElement('div');
                container.classList.add('order-option');

                const nameLabel = document.createElement('span');
                nameLabel.innerText = option.name;
                container.appendChild(nameLabel);

                let input;
                if (option.selectionType === 'radio') {
                  input = document.createElement('input');
                  input.type = 'radio';
                  input.name = option.group;
                  input.value = option.name;
                  input.dataset.price = option.price;
                } else {
                  input = document.createElement('input');
                  input.type = 'number';
                  input.min = 0;
                  input.value = 0;
                  input.name = `${group.name}_${sub.name}_${option.name}`;
                  input.dataset.price = option.price;
                  input.classList.add('order-quantity');
                  input.style.marginLeft = '10px';
                }

                container.appendChild(input);
                orderFormContainer.appendChild(container);
              });
            });
          }
        });
      }
    });

    // --- TOTAL DISPLAY ---
    const totalDisplay = document.getElementById('total');

    function updateTotal() {
      let total = 0;

      // Number inputs
      document.querySelectorAll('.order-quantity').forEach(input => {
        const qty = Math.max(0, parseInt(input.value) || 0);
        const price = parseFloat(input.dataset.price) || 0;
        total += qty * price;
      });

      // Radio inputs
      document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        total += parseFloat(input.dataset.price) || 0;
      });

      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    document.querySelectorAll('.order-quantity, input[type="radio"]').forEach(input => {
      input.addEventListener('input', updateTotal);
      input.addEventListener('change', updateTotal);
    });

    updateTotal();

    // --- GENERATE QR CODE ---
    document.getElementById('qrForm').addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(document.getElementById('qrForm'));
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if (f.type === 'order') {
          if (f.groups) {
            f.groups.forEach(group => {
              if (group.subSections) {
                group.subSections.forEach(sub => {
                  sub.options.forEach(option => {
                    let qtyOrSelection = 0;
                    if (option.selectionType === 'radio') {
                      const selected = formData.get(option.group);
                      qtyOrSelection = (selected === option.name) ? 1 : 0;
                      total += qtyOrSelection * parseFloat(option.price);
                    } else {
                      qtyOrSelection = parseInt(formData.get(`${group.name}_${sub.name}_${option.name}`)) || 0;
                      total += qtyOrSelection * parseFloat(option.price);
                    }
                    values.push(qtyOrSelection);
                  });
                });
              }
            });
          }
        } else {
          values.push(formData.get(f.code));
        }
      });

      values.push(total.toFixed(2));
      const qrText = values.join('\t') + '\n';
      document.getElementById('qr').innerHTML = '';
      new QRCode(document.getElementById('qr'), qrText);
    });
  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
