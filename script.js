// Load config and build form
fetch('config.json')
  .then(res => res.json())
  .then(config => {
    document.getElementById('title').innerText = config.title;
    const form = document.getElementById('qrForm');

    config.fields.forEach(field => {
      const label = document.createElement('label');
      label.innerText = field.label;
      const input = document.createElement('input');
      input.type = field.type;
      input.name = field.code;
      if (field.required) input.required = true;
      label.appendChild(input);
      form.insertBefore(label, form.querySelector('button'));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const values = [];
      config.fields.forEach(f => values.push(formData.get(f.code)));
      const qrText = values.join('\t') + '\n';
      document.getElementById('qr').innerHTML = '';
      new QRCode(document.getElementById('qr'), qrText);
    });
  });
