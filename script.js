// Fetch the external config file
fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;
    const form = document.getElementById('qrForm');

    // --- GENERATE FORM FIELDS ---
    config.fields.forEach(field => {
      const label = document.createElement('label');
      label.innerText = field.label;

      if (field.type === 'order') {
        field.options.forEach(option => {
          const container = document.createElement('div');
          container.style.marginBottom = '8px';

          const nameLabel = document.createElement('span');
          nameLabel.innerText = `${option.name} ($${option.price}) `;
          container.appendChild(nameLabel);

          const input = document.createElement('input');
          input.type = 'number';
          input.min = 0;
          input.value = 0; // blank treated as 0
          input.name = option.name;
          input.dataset.price = option.price;
          input.style.width = '60px';
          input.classList.add('order-quantity'); // only these counted in total
          container.appendChild(input);

          label.appendChild(container);
        });
      } else {
        const input = document.createElement('input');
        input.type = field.type;
        input.name = field.code;
        if (field.required) input.required = true;
        label.appendChild(input);
      }

      form.insertBefore(label, form.querySelector('button'));
    });

    // --- TOTAL DISPLAY ---
    const totalDisplay = document.createElement('div');
    totalDisplay.id = 'total';
    totalDisplay.style.fontWeight = 'bold';
    totalDisplay.style.marginTop = '15px';
    form.insertBefore(totalDisplay, form.querySelector('button'));

    // --- UPDATE TOTAL ---
    function updateTotal() {
      let total = 0;
      form.querySelectorAll('.order-quantity').forEach(input => {
        const qty = Math.max(0, parseInt(input.value) || 0);
        const price = parseFloat(input.dataset.price) || 0;
        total += qty * price;
      });
      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }

    // Listen for changes on order inputs
    form.querySelectorAll('.order-quantity').forEach(input => {
      input.addEventListener('input', updateTotal);
    });

    // Initialize total
    updateTotal();

    // --- GENERATE QR CODE ---
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if (f.type === 'order') {
          // For QR: push only numbers
          f.options.forEach(option => {
            const qty = parseInt(formData.get(option.name)) || 0;
            values.push(qty); // just the number
            total += qty * parseFloat(option.price);
          });
        } else {
          values.push(formData.get(f.code));
        }
      });

      values.push(total.toFixed(2)); // total as last tab cell

      const qrText = values.join('\t') + '\n';
      document.getElementById('qr').innerHTML = '';
      new QRCode(document.getElementById('qr'), qrText);
    });
  })
  .catch(err => {
    console.error('Error loading config:', err);
    document.getElementById('title').innerText = 'Error loading form';
  });
