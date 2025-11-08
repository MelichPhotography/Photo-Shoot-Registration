fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;

    const playerInfoContainer = document.getElementById('playerInfo');
    const orderFormContainer = document.getElementById('orderForm');

    // --- Player info fields ---
    config.fields.forEach(field => {
      if (field.type !== 'order') {
        const label = document.createElement('label');
        label.innerText = field.label;

        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.code;
        if (field.required) input.required = true;

        label.appendChild(input);
        playerInfoContainer.appendChild(label);
      }
    });

    // --- Order groups ---
    const orderFields = config.fields.filter(f => f.type === 'order');
    orderFields.forEach(field => {
      field.groups.forEach(group => {
        const groupHeader = document.createElement('div');
        groupHeader.classList.add('group-header');
        groupHeader.innerText = group.name;
        orderFormContainer.appendChild(groupHeader);

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

            const nameEl = document.createElement('div');
            nameEl.classList.add('order-name');
            nameEl.innerText = option.name;
            container.appendChild(nameEl);

            if (option.price !== undefined) {
              const priceEl = document.createElement('div');
              priceEl.classList.add('order-price');
              priceEl.innerText = `$${option.price}`;
              container.appendChild(priceEl);
            }

            if (option.quantity_inline) {
              const qtyInput = document.createElement('input');
              qtyInput.type = 'number';
              qtyInput.min = 0;
              qtyInput.value = 0;
              qtyInput.classList.add('order-quantity');
              qtyInput.name = option.name.replace(/\s+/g, '_');
              container.appendChild(qtyInput);
            }

            // Individual/Team selectors for specific prints
            if (option.select_team_individual) {
              const subOptions = document.createElement('div');
              subOptions.classList.add('sub-options');

              ['Individual', 'Team'].forEach(val => {
                const select = document.createElement('select');
                select.name = `${option.name.replace(/\s+/g, '_')}_${val}`;
                const opt = document.createElement('option');
                opt.value = val.toLowerCase();
                opt.innerText = val;
                select.appendChild(opt);
                subOptions.appendChild(select);
              });

              orderFormContainer.appendChild(container);
              orderFormContainer.appendChild(subOptions);
              return;
            }

            orderFormContainer.appendChild(container);
          });
        });
      });
    });

    const totalDisplay = document.getElementById('total');

    function updateTotal() {
      let total = 0;
      document.querySelectorAll('.order-quantity').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const priceEl = input.previousElementSibling; // should be price div
        let price = 0;
        if (priceEl && priceEl.classList.contains('order-price')) {
          price = parseFloat(priceEl.innerText.replace('$', '')) || 0;
        }
        total += qty * price;
      });
      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    document.querySelectorAll('.order-quantity').forEach(input => {
      input.addEventListener('input', updateTotal);
    });

    updateTotal();

    // --- QR Code generation ---
    document.getElementById('qrForm').addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(document.getElementById('qrForm'));
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if (f.type === 'order') {
          f.groups.forEach(group => {
            group.subSections.forEach(sub => {
              sub.options.forEach(option => {
                const qtyName = option.name.replace(/\s+/g, '_');
                const qty = parseInt(formData.get(qtyName)) || 0;
                values.push(qty);
                total += qty * (option.price || 0);

                // add team/individual selections if present
                if (option.select_team_individual) {
                  ['Individual', 'Team'].forEach(val => {
                    const sel = formData.get(`${qtyName}_${val}`);
                    values.push(sel || '');
                  });
                }
              });
            });
          });
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
