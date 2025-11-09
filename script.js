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

                  const qtyHint = document.createElement('span');
                  qtyHint.classList.add('option-quantity');
                  qtyHint.innerText = 'Qty:';
                  qtyHint.style.fontSize = '0.8em';
                  qtyHint.style.color = '#555';
                  qtyHint.style.marginLeft = '5px';
                  container.appendChild(qtyHint);
                  
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


                } else if (option.select_team_individual) {
  const label = document.createElement('span');
  label.innerText = option.name;
  label.style.width = '150px';
  container.appendChild(label);

  const select = document.createElement('select');
  select.name = `${sub.name}_${option.name}`;

  // Add options including a placeholder
  const noneOption = document.createElement('option');
  noneOption.value = "";
  noneOption.innerText = "Select One";
  select.appendChild(noneOption);

  ['Team', 'Individual'].forEach(opt => {
    const optionEl = document.createElement('option');
    optionEl.value = opt.toLowerCase();
    optionEl.innerText = opt;
    select.appendChild(optionEl);
  });

  // Apply default if provided in config
  if (option.default === "team") {
    select.value = "team";
  } else if (option.default === "individual") {
    select.value = "individual";
  } else {
    select.value = ""; // Default to placeholder
  }

  container.appendChild(select);
}// Handle name-only rows (no price, no selector, no qty)
else {
  const label = document.createElement('span');
  label.innerText = option.name;
  //label.style.fontStyle = 'italic';
  //label.style.paddingLeft = '20px';
  container.appendChild(label);
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
      document.getElementById('downloadReceipt').disabled = false;

    });

    // --- DOWNLOAD RECEIPT ---
document.getElementById('downloadReceipt').addEventListener('click', async () => {
  const receiptEl = document.getElementById('receipt');

  // Clear previous receipt content
  const playerReceipt = document.getElementById('playerInfoReceipt');
  const orderReceipt = document.getElementById('orderReceipt');
  const totalReceipt = document.getElementById('totalReceipt');
  const qrForDownload = document.getElementById('qrForDownload');
  playerReceipt.innerHTML = '';
  orderReceipt.innerHTML = '';
  totalReceipt.innerHTML = '';
  qrForDownload.innerHTML = '';

  // --- Copy form values ---
  const formData = new FormData(document.getElementById('qrForm'));
  const configFields = config.fields; // make sure `config` is global or accessible here

  configFields.forEach(f => {
    if (f.type !== 'order') {
      const val = formData.get(f.code) || '';
      const p = document.createElement('p');
      p.innerText = `${f.label}: ${val}`;
      playerReceipt.appendChild(p);
    } else {
      f.groups.forEach(group => {
        const groupDiv = document.createElement('div');
        const groupHeader = document.createElement('h3');
        groupHeader.innerText = group.name;
        groupDiv.appendChild(groupHeader);

        group.subSections.forEach(sub => {
          const subHeader = document.createElement('strong');
          subHeader.innerText = sub.name;
          groupDiv.appendChild(subHeader);
          groupDiv.appendChild(document.createElement('br'));

          sub.options.forEach(option => {
            let value = '';
            if (option.quantity_inline) {
              const qty = formData.get(`${sub.name}_${option.name}`) || 0;
              if (parseInt(qty) > 0) value = `${option.name} x ${qty}`;
            } else if (option.select_team_individual) {
              value = `${option.name}: ${formData.get(`${sub.name}_${option.name}`) || ''}`;
            } else {
              value = option.name;
            }
            if (value) {
              const p = document.createElement('p');
              p.style.marginLeft = '10px';
              p.innerText = value;
              groupDiv.appendChild(p);
            }
          });
        });

        orderReceipt.appendChild(groupDiv);
      });
    }
  });

  // --- Total ---
  let total = 0;
  document.querySelectorAll('.order-quantity').forEach(input => {
    const qty = parseInt(input.value) || 0;
    const price = parseFloat(input.dataset.price) || 0;
    total += qty * price;
  });
  totalReceipt.innerText = `Total: $${total.toFixed(2)}`;

  // --- Copy QR code ---
  const qrContainer = document.getElementById('qr');
  const qrCanvas = qrContainer.querySelector('canvas');
  const qrImg = qrContainer.querySelector('img');
  let qrClone;

  if (qrCanvas) {
    qrClone = document.createElement('img');
    qrClone.src = qrCanvas.toDataURL();
  } else if (qrImg) {
    qrClone = qrImg.cloneNode();
  }

  if (qrClone) {
    qrForDownload.appendChild(qrClone);
  } else {
    qrForDownload.innerText = 'QR code not generated.';
  }

  // --- Show receipt temporarily to render ---
  receiptEl.style.display = 'block';

  // --- Generate PDF ---
  html2canvas(receiptEl, { useCORS: true, logging: true, scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('receipt.pdf');

    // Hide receipt again
    receiptEl.style.display = 'none';
  });
}); 
  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
