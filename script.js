
fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;
    const form = document.getElementById('qrForm');

    // Dynamically create form fields
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
          input.value = 0;
          input.name = option.name;
          input.dataset.price = option.price;
          input.style.width = '60px';
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

    // Add total display
    const totalDisplay = document.createElement('div');
    totalDisplay.id = 'total';
    totalDisplay.style.fontWeight = 'bold';
    totalDisplay.style.marginTop = '15px';
    form.insertBefore(totalDisplay, form.querySelector('button'));

    // Update total on quantity change
    form.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => {
        let total = 0;
        form.querySelectorAll('input[type="number"]').forEach(i => {
          total += i.valueAsNumber * parseFloat(i.dataset.price);
        });
        totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
      });
    });

    // Generate QR on submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = [];

      config.fields.forEach(f => {
        if (f.type === 'order') {
          const orderItems = [];
          f.options.forEach(option => {
            const qty = formData.get(option.name) || 0;
            orderItems.push(`${option.name}:${qty}`);
          });
          values.push(orderItems.join(';'));
        } else {
          values.push(formData.get(f.code));
        }
      });

      const qrText = values.join('\t') + '\n';
      document.getElementById('qr').innerHTML = '';
      new QRCode(document.getElementById('qr'), qrText);
    });
  });
