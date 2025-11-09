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
        label.innerText = field.label;

        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.code;
        if (field.required) input.required = true;

        label.appendChild(input);
        playerInfoContainer.appendChild(label);
        return;
      }

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
                container.style.marginBottom = '8px';

                if (option.quantity_inline) {
                  // Name
                  const nameLabel = document.createElement('span');
                  nameLabel.classList.add('option-name');
                  nameLabel.innerText = option.name;
                  nameLabel.style.flex = '1'; // Take remaining space
                  container.appendChild(nameLabel);

                  // Price
                  const priceLabel = document.createElement('span');
                  priceLabel.classList.add('option-price');
                  priceLabel.innerText = `$${option.price}`;
                  priceLabel.style.fontWeight = 'bold';
                  priceLabel.style.width = '60px';
                  priceLabel.style.textAlign = 'right';
                  priceLabel.style.marginRight = '10px';
                  container.appendChild(priceLabel);

                  const input = document.createElement('input');
                  input.type = 'number';
                  input.min = 0;
                  input.value = 0;
                  input.name = `${sub.name}_${option.name}`;
                  input.dataset.price = option.price;
                  input.classList.add('order-quantity');
                  input.style.width = '60px';
                  input.style.marginRight = '10px';
                  container.appendChild(input);

                  const qtyHint = document.createElement('span');
                  qtyHint.innerText = 'Qty:';
                  qtyHint.style.fontSize = '0.8em';
                  qtyHint.style.color = '#555';
                  qtyHint.style.marginLeft = '5px';
                  container.appendChild(qtyHint);

                } else if (option.select_team_individual) {
                  const label = document.createElement('span');
                  label.innerText = option.name;
                  label.style.width = '150px';
                  container.appendChild(label);

                  const select = document.createElement('select');
                  select.name = `${sub.name}_${option.name}`;
                  ['Individual', 'Team'].forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt;
                    optionEl.innerText = opt;
                    select.appendChild(optionEl);
                  });
                  container.appendChild(select);
                }

                orderFormContainer.appendChild(container);
              });
            });
          }
        });
      }
    });

    // --- PHONE NUMBER LIVE FORMAT ---
    const phoneInput = playerInfoContainer.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', e => {
        let cleaned = phoneInput.value.replace(/\D/g, '');
        if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);

        let formatted = '';
        if (cleaned.length > 0) formatted += '(' + cleaned.slice(0, 3);
        if (cleaned.length >= 4) formatted += ') ' + cleaned.slice(3, 6);
        if (cleaned.length >= 7) formatted += '-' + cleaned.slice(6, 10);

        phoneInput.value = formatted;
      });
    }
    
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
          f.groups.forEach(group => {
            group.subSections.forEach(sub => {
              sub.options.forEach(option => {
                if (option.quantity_inline) {
                  const inputName = `${sub.name}_${option.name}`;
                  const qty = parseInt(formData.get(inputName)) || 0;
                  values.push(qty);
                  total += qty * parseFloat(option.price);
                } else if (option.select_team_individual) {
                  values.push(formData.get(`${sub.name}_${option.name}`));
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
