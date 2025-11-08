// Fetch the external config file
fetch('config_order.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;
    const form = document.getElementById('qrForm');

    // --- GENERATE FORM FIELDS ---
    config.fields.forEach(field => {
      // Non-order fields (Name, Email, Jersey, Team)
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

        form.insertBefore(label, form.querySelector('button'));
        return;
      }

      // Order fields
      if (field.groups) {
        field.groups.forEach(group => {
          // Group header
          const groupHeader = document.createElement('div');
          groupHeader.classList.add('group-header');
          groupHeader.innerText = group.name;
          form.insertBefore(groupHeader, form.querySelector('button'));

          // Group note
          if (group.note) {
            const noteEl = document.createElement('div');
            noteEl.classList.add('group-note');
            noteEl.innerText = group.note;
            form.insertBefore(noteEl, form.querySelector('button'));
          }

          // Options
          group.options.forEach(option => {
            const container = document.createElement('div');
            container.classList.add('order-option');

            const nameLabel = document.createElement('span');
            nameLabel.innerText = `${option.name} ($${option.price})`;
            container.appendChild(nameLabel);

            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.value = 0;
            input.name = `${field.code}_${group.name}_${option.name}`; // unique input name
            input.dataset.price = option.price;
            input.classList.add('order-quantity'); // counted in total
            container.appendChild(input);

            form.insertBefore(container, form.querySelector('button'));
          });
        });
      } else {
        // Fallback for flat options
        field.options.forEach(option => {
          const container = document.createElement('div');
          container.classList.add('order-option');

          const nameLabel = document.createElement('span');
          nameLabel.innerText = `${option.name} ($${option.price})`;
          container.appendChild(nameLabel);

          const input = document.createElement('input');
          input.type = 'number';
          input.min = 0;
          input.value = 0;
          input.name = option.name;
          input.dataset.price = option.price;
          input.classList.add('order-quantity');
          container.appendChild(input);

          form.insertBefore(container, form.querySelector('button'));
        });
      }
    });

    // --- TOTAL DISPLAY ---
    const totalDisplay = document.createElement('div');
    totalDisplay.id = 'total';
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

    form.querySelectorAll('.order-quantity').forEach(input => {
      input.addEventListener('input', updateTotal);
    });

    updateTotal();

    // --- GENERATE QR CODE ---
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = [];
      let total = 0;

      config.fields.forEach(f => {
        if (f.type === 'order') {
          if (f.groups) {
            f.groups.forEach(group => {
              group.options.forEach(option => {
                const inputName = `${f.code}_${group.name}_${option.name}`;
                const qty = parseInt(formData.get(inputName)) || 0;
                values.push(qty);
                total += qty * parseFloat(option.price);
              });
            });
          } else {
            f.options.forEach(option => {
              const qty = parseInt(formData.get(option.name)) || 0;
              values.push(qty);
              total += qty * parseFloat(option.price);
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
