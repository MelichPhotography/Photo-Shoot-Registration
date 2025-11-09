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

              // Quantity input
              if (option.quantity_inline) {
                const nameLabel = document.createElement('span');
                nameLabel.classList.add('option-name');
                nameLabel.innerText = option.name;
                container.appendChild(nameLabel);

                const priceLabel = document.createElement('span');
                priceLabel.classList.add('option-price');
                priceLabel.innerText = `$${option.price}`;
                priceLabel.style.fontWeight = 'bold';
                container.appendChild(priceLabel);

                const qtyHint = document.createElement('span');
                qtyHint.classList.add('option-quantity');
                qtyHint.innerText = 'Qty:';
                container.appendChild(qtyHint);

                const input = document.createElement('input');
                input.type = 'number';
                input.min = 0;
                input.value = 0;
                input.name = `${sub.name}_${option.name}`;
                input.dataset.price = option.price;
                input.classList.add('order-quantity');
                container.appendChild(input);

              } 
              // Team/Individual select
              else if (option.select_team_individual) {
                const label = document.createElement('span');
                label.innerText = option.name;
                label.style.width = '150px';
                container.appendChild(label);

                const select = document.createElement('select');
                select.name = `${sub.name}_${option.name}`;

                const noneOption = document.createElement('option');
                noneOption.value = "";
                noneOption.innerText = "Select One";
                select.appendChild(noneOption);

                ['Team','Individual'].forEach(opt => {
                  const optionEl = document.createElement('option');
                  optionEl.value = opt.toLowerCase();
                  optionEl.innerText = opt;
                  select.appendChild(optionEl);
                });

                if(option.default) select.value = option.default.toLowerCase();

                container.appendChild(select);
              } 
              // Name-only
              else {
                const label = document.createElement('span');
                label.innerText = option.name;
                container.appendChild(label);
              }

              orderFormContainer.appendChild(container);
            });
          });
        });
      }
    });

    // --- PHONE NUMBER FORMAT ---
    const phoneInput = playerInfoContainer.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        let cleaned = phoneInput.value.replace(/\D/g, '');
        if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);

        let formatted = '';
        if (cleaned.length > 0) formatted += '(' + cleaned.slice(0,3);
        if (cleaned.length >= 4) formatted += ') ' + cleaned.slice(3,6);
        if (cleaned.length >= 7) formatted += '-' + cleaned.slice(6,10);

        phoneInput.value = formatted;
      });
    }

    // --- TOTAL CALCULATION ---
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
    document.querySelectorAll('.order-quantity').forEach(input => input.addEventListener('input', updateTotal));
    updateTotal();

    // --- GENERATE QR ---
    const qrContainer = document.getElementById('qr');
    document.getElementById('qrForm').addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(document.getElementById('qrForm'));
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if(f.type === 'order') {
          f.groups.forEach(group => {
            group.subSections.forEach(sub => {
              const hasQtyItem = sub.options.some(option => option.quantity_inline && (parseInt(formData.get(`${sub.name}_${option.name}`)) || 0) > 0);

              sub.options.forEach(option => {
                if(option.quantity_inline) {
                  const qty = parseInt(formData.get(`${sub.name}_${option.name}`)) || 0;
                  values.push(qty);
                  total += qty * parseFloat(option.price);
                } else if(option.select_team_individual && hasQtyItem) {
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

      qrContainer.innerHTML = '';
      new QRCode(qrContainer, qrText);
    });

    // --- DOWNLOAD RECEIPT ---
    document.getElementById('downloadReceipt').addEventListener('click', () => {
      const formData = new FormData(document.getElementById('qrForm'));
      let total = 0;

      let receiptHTML = `<html><head><title>Order Receipt</title></head><body>`;
      receiptHTML += `<h2>Melich Photography Order Receipt</h2><ul>`;

      config.fields.forEach(f => {
        if(f.type === 'order') {
          f.groups.forEach(group => {
            let groupHTML = `<li><strong>${group.name}</strong><ul>`;
            group.subSections.forEach(sub => {
              const hasQtyItem = sub.options.some(option => option.quantity_inline && (parseInt(formData.get(`${sub.name}_${option.name}`)) || 0) > 0);
              if(!hasQtyItem) return;

              let subHTML = `<li>${sub.name}<ul>`;
              sub.options.forEach(option => {
                if(option.quantity_inline) {
                  const qty = parseInt(formData.get(`${sub.name}_${option.name}`)) || 0;
                  if(qty > 0) {
                    const lineTotal = (qty * parseFloat(option.price)).toFixed(2);
                    total += parseFloat(lineTotal);
                    subHTML += `<li>${option.name} x${qty} - $${lineTotal}</li>`;
                  }
                } else if(option.select_team_individual && hasQtyItem) {
                  const selection = formData.get(`${sub.name}_${option.name}`);
                  if(selection) subHTML += `<li>${option.name}: ${selection}</li>`;
                }
              });
              subHTML += `</ul></li>`;
              groupHTML += subHTML;
            });
            groupHTML += `</ul></li>`;
            receiptHTML += groupHTML;
          });
        } else {
          const value = formData.get(f.code);
          if(value) receiptHTML += `<li>${f.label}: ${value}</li>`;
        }
      });

      receiptHTML += `</ul><p><strong>Total: $${total.toFixed(2)}</strong></p><div id="qrReceipt"></div></body></html>`;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = receiptHTML;
      const qrReceiptDiv = tempDiv.querySelector('#qrReceipt');

      const qrText = Array.from(formData.entries()).map(([k,v]) => `${k}: ${v}`).join('\n');
      const qrCode = new QRCode(qrReceiptDiv, { text: qrText, width:128, height:128 });

      const canvas = qrReceiptDiv.querySelector('canvas');
      if(canvas) {
        const imgData = canvas.toDataURL('image/png');
        qrReceiptDiv.innerHTML = `<img src="${imgData}" alt="QR Code">`;
      }

      const blob = new Blob([tempDiv.innerHTML], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'order_receipt.html';
      link.click();
    });

  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
