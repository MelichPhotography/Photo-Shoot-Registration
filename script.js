fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;

    const playerInfoContainer = document.getElementById('playerInfo');
    const orderFormContainer = document.getElementById('orderForm');

    // --- GENERATE PLAYER INFO FIELDS ---
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
      }
    });

    // --- GENERATE ORDER GROUPS ---
    config.fields.forEach(field => {
      if (field.type === 'order' && field.groups) {
        field.groups.forEach(group => {
          // Group header
          const groupHeader = document.createElement('div');
          groupHeader.classList.add('group-header');
          groupHeader.innerText = group.name;
          orderFormContainer.appendChild(groupHeader);

          // Subsections
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

            // Options
            sub.options.forEach(option => {
              const container = document.createElement('div');
              container.classList.add('order-option');

              // Main package name & price
              const nameLabel = document.createElement('div');
              nameLabel.innerHTML = `<strong>${option.name}</strong> - ${option.displayPrice || '$' + option.price}`;
              container.appendChild(nameLabel);

              // If variants exist (Individual/Team, multiple prints)
              if (option.variants) {
                option.variants.forEach(variant => {
                  const variantDiv = document.createElement('div');
                  variantDiv.style.marginLeft = '20px'; // indent
                  const variantLabel = document.createElement('label');

                  const input = document.createElement('input');
                  input.type = 'checkbox'; // allow multiple selections
                  input.name = variant.code;
                  input.dataset.price = option.price;
                  input.classList.add('order-quantity');

                  variantLabel.appendChild(input);
                  variantLabel.appendChild(document.createTextNode(' ' + variant.name));
                  variantDiv.appendChild(variantLabel);
                  container.appendChild(variantDiv);
                });
              } else {
                // Standard numeric quantity input
                const qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.min = 0;
                qtyInput.value = 0;
                qtyInput.name = `${sub.name}_${option.name}`;
                qtyInput.dataset.price = option.price;
                qtyInput.classList.add('order-quantity');
                qtyInput.style.marginTop = '4px';
                container.appendChild(qtyInput);
              }

              orderFormContainer.appendChild(container);
            });
          });
        });
      }
    });

    // --- TOTAL DISPLAY ---
    const totalDisplay = document.getElementById('total');

    function updateTotal() {
      let total = 0;

      document.querySelectorAll('.order-quantity').forEach(input => {
        if (input.type === 'checkbox') {
          if (input.checked) total += parseFloat(input.dataset.price) || 0;
        } else {
          const qty = Math.max(0, parseInt(input.value) || 0);
          total += qty * parseFloat(input.dataset.price || 0);
        }
      });

      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    document.querySelectorAll('.order-quantity').forEach(input => {
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
        if (f.type === 'order' && f.groups) {
          f.groups.forEach(group => {
            group.subSections.forEach(sub => {
              sub.options.forEach(option => {
                if (option.variants) {
                  option.variants.forEach(variant => {
                    const checked = formData.get(variant.code);
                    values.push(checked ? '1' : '0');
                    if (checked) total += parseFloat(option.price) || 0;
                  });
                } else {
                  const qty = parseInt(formData.get(`${sub.name}_${option.name}`)) || 0;
                  values.push(qty);
                  total += qty * parseFloat(option.price || 0);
                }
              });
            });
          });
        } else {
          values.push(formData.get(f.code) || '');
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
