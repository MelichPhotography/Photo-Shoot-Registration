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
        input.type = field.type === 'number' ? 'tel' : field.type; // phone as tel
        input.name = field.code;
        input.required = field.required || false;

        // --- Phone formatting ---
        if (field.code === 'phone') {
          input.addEventListener('input', (e) => {
            let val = input.value.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);
            if (val.length > 6) {
              input.value = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
            } else if (val.length > 3) {
              input.value = `(${val.slice(0,3)}) ${val.slice(3)}`;
            } else if (val.length > 0) {
              input.value = `(${val}`;
            }
          });
        }

        label.appendChild(input);
        playerInfoContainer.appendChild(label);
        return;
      }

      // --- ORDER GROUPS ---
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
                nameLabel.innerText = `${option.name} ($${option.price})`;
                container.appendChild(nameLabel);

                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.value = 0;
                input.name = `${field.code}_${group.name}_${sub.name}_${option.name}`;
                input.dataset.price = option.price;
                input.classList.add('order-quantity');
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
      document.querySelectorAll('.order-quantity').forEach(input => {
        const qty = Math.max(0, parseInt(input.value) || 0);
        const price = parseFloat(input.dataset.price) || 0;
        total += qty * price;
      });
      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    document.querySelectorAll('.order-quantity').forEach(input => {
      input.addEventListener('input', updateTotal);
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
                    const inputName = `${f.code}_${group.name}_${sub.name}_${option.name}`;
                    const qty = parseInt(formData.get(inputName)) || 0;
                    values.push(qty); // only numbers
                    total += qty * parseFloat(option.price);
                  });
                });
              }
            });
          }
        } else {
          values.push(formData.get(f.code));
        }
      });

      values.push(total.toFixed(2)); // add total at the end
      const qrText = values.join('\t') + '\n';
      document.getElementById('qr').innerHTML = '';
      new QRCode(document.getElementById('qr'), qrText);
    });

  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
