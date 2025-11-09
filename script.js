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
  const receiptEl = document.createElement('div');
  receiptEl.style.padding = '20px';
  receiptEl.style.background = '#fff';
  receiptEl.style.width = '400px';
  receiptEl.style.fontFamily = 'Arial, sans-serif';
  receiptEl.innerHTML = `
    <h2>${config.title}</h2>
    <h3>Player Info</h3>
    <p>Name: ${document.querySelector('input[name="player_name"]').value}</p>
    <p>Parent: ${document.querySelector('input[name="parent_name"]').value}</p>
    <p>Phone: ${document.querySelector('input[name="phone"]').value}</p>
    <p>Email: ${document.querySelector('input[name="email"]').value}</p>
    <h3>Order Summary</h3>
    <ul>
      ${Array.from(document.querySelectorAll('.order-quantity')).map(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
          const price = parseFloat(input.dataset.price);
          return `<li>${input.name}: ${qty} × $${price} = $${(qty*price).toFixed(2)}</li>`;
        }
        return '';
      }).join('')}
    </ul>
    <h3>${totalDisplay.innerText}</h3>
    <h3>QR Code</h3>
    <div id="qrForDownload"></div>
  `;

  // Safely clone QR code for receipt
const qrContainer = document.getElementById('qr');
if (qrContainer) {
  const qrCanvas = qrContainer.querySelector('canvas');
  const qrImg = qrContainer.querySelector('img');
  let qrClone;

  if (qrCanvas) {
    // If it's a canvas, convert to image
    qrClone = document.createElement('img');
    qrClone.src = qrCanvas.toDataURL();
  } else if (qrImg) {
    qrClone = qrImg.cloneNode();
  }

  if (qrClone) {
    receiptEl.querySelector('#qrForDownload').appendChild(qrClone);
  }
}


  // Convert to canvas and PDF
  const canvas = await html2canvas(receiptEl);
  const imgData = canvas.toDataURL('image/png');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save('receipt.pdf');
});
    
  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
