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
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.marginBottom = '6px';

                const nameLabel = document.createElement('span');
                nameLabel.innerText = option.name;
                nameLabel.style.flex = '1';
                container.appendChild(nameLabel);

                if (option.note) {
                  const noteSpan = document.createElement('span');
                  noteSpan.innerText = option.note;
                  noteSpan.style.marginLeft = '10px';
                  noteSpan.style.fontWeight = 'bold';
                  container.appendChild(noteSpan);
                }

                if (option.quantity_inline) {
                  const input = document.createElement('input');
                  input.type = 'number';
                  input.min = 0;
                  input.value = 0;
                  input.name = option.name.replace(/\s+/g, '_');
                  input.dataset.price = option.price;
                  input.classList.add('order-quantity');
                  input.style.marginLeft = '10px';
                  container.appendChild(input);
                }

                orderFormContainer.appendChild(container);

                // Dropdown for individual/team
                if (option.select_team_individual) {
                  const subOptions = document.createElement('div');
                  subOptions.style.marginLeft = '20px';
                  subOptions.style.display = 'flex';
                  subOptions.style.gap = '10px';

                  ['Individual', 'Team'].forEach(val => {
                    const selectLabel = document.createElement('label');
                    selectLabel.style.display = 'flex';
                    selectLabel.style.alignItems = 'center';
                    selectLabel.innerText = val + ': ';

                    const select = document.createElement('select');
                    select.name = `${option.name.replace(/\s+/g, '_')}_${val}`;
                    const opt = document.createElement('option');
                    opt.value = val.toLowerCase();
                    opt.innerText = val;
                    select.appendChild(opt);
                    selectLabel.appendChild(select);
                    subOptions.appendChild(selectLabel);
                  });

                  orderFormContainer.appendChild(subOptions);
                }
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
                    if (option.select_team_individual) {
                      ['Individual', 'Team'].forEach(val => {
                        values.push(formData.get(`${option.name.replace(/\s+/g, '_')}_${val}`));
                      });
                    } else {
                      const qty = parseInt(formData.get(option.name.replace(/\s+/g, '_'))) || 0;
                      values.push(qty);
                      total += qty * parseFloat(option.price);
                    }
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
