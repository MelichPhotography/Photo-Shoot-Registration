fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;

    const playerInfoContainer = document.getElementById('playerInfo');
    const orderFormContainer = document.getElementById('orderForm');

    // --- GENERATE FORM FIELDS ---
    config.fields.forEach(f => {
      if (f.type !== 'order') {
        const label = document.createElement('label');
        label.innerText = f.label;

        const input = document.createElement('input');
        input.type = f.type;
        input.name = f.code;
        if(f.required) input.required = true;
        label.appendChild(input);

        playerInfoContainer.appendChild(label);
        return;
      }

      // Order groups
      if (f.groups) {
        f.groups.forEach(group => {
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

              if(sub.note) {
                const noteEl = document.createElement('div');
                noteEl.classList.add('sub-section-note');
                noteEl.innerText = sub.note;
                orderFormContainer.appendChild(noteEl);
              }

              sub.options.forEach(option => {
                const container = document.createElement('div');
                container.classList.add('order-option');

                // Name
                const nameLabel = document.createElement('span');
                nameLabel.classList.add('name');
                nameLabel.innerText = option.name;
                container.appendChild(nameLabel);

                // Quantity inline
                if(option.quantity_inline) {
                  const input = document.createElement('input');
                  input.type = 'number';
                  input.min = 0;
                  input.value = 0;
                  input.name = `${f.code}_${group.name}_${sub.name}_${option.name}`;
                  input.dataset.price = option.price;
                  input.classList.add('order-quantity');
                  container.appendChild(input);
                }

                // Price
                const priceSpan = document.createElement('span');
                priceSpan.classList.add('price');
                priceSpan.innerText = `$${option.price}`;
                container.appendChild(priceSpan);

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
      document.querySelectorAll('.order-quantity').forEach(i => {
        const qty = Math.max(0, parseInt(i.value) || 0);
        const price = parseFloat(i.dataset.price) || 0;
        total += qty * price;
      });
      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    document.querySelectorAll('.order-quantity').forEach(i => i.addEventListener('input', updateTotal));
    updateTotal();

    // --- GENERATE QR CODE ---
    document.getElementById('qrForm').addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(document.getElementById('qrForm'));
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if(f.type === 'order') {
          if(f.groups) {
            f.groups.forEach(group => {
              if(group.subSections) {
                group.subSections.forEach(sub => {
                  sub.options.forEach(option => {
                    const inputName = `${f.code}_${group.name}_${sub.name}_${option.name}`;
                    const qty = parseInt(formData.get(inputName)) || 0;
                    values.push(qty);
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
