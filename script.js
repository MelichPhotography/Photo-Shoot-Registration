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

      field.groups?.forEach(group => {
        const groupHeader = document.createElement('div');
        groupHeader.classList.add('group-header');
        groupHeader.innerText = group.name;
        orderFormContainer.appendChild(groupHeader);

        group.subSections?.forEach(sub => {
          const subHeader = document.createElement('div');
          subHeader.classList.add('sub-section-header');
          subHeader.innerText = sub.name;
          orderFormContainer.appendChild(subHeader);

          if(sub.note){
            const noteEl = document.createElement('div');
            noteEl.classList.add('sub-section-note');
            noteEl.innerText = sub.note;
            orderFormContainer.appendChild(noteEl);
          }

          sub.options.forEach(option => {
            const container = document.createElement('div');
            container.classList.add('order-option');

            if(option.quantity_inline){
              const nameLabel = document.createElement('span');
              nameLabel.classList.add('option-name');
              nameLabel.innerText = option.name;
              container.appendChild(nameLabel);

              const priceLabel = document.createElement('span');
              priceLabel.classList.add('option-price');
              priceLabel.innerText = `$${option.price}`;
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

            } else if(option.select_team_individual){
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

            } else {
              const label = document.createElement('span');
              label.innerText = option.name;
              container.appendChild(label);
            }

            orderFormContainer.appendChild(container);
          });
        });
      });
    });

    // --- PHONE FORMAT ---
    const phoneInput = playerInfoContainer.querySelector('input[type="tel"]');
    if(phoneInput){
      phoneInput.addEventListener('input', e=>{
        let cleaned = phoneInput.value.replace(/\D/g,'').slice(0,10);
        let formatted='';
        if(cleaned.length>0) formatted+='('+cleaned.slice(0,3);
        if(cleaned.length>=4) formatted+=') '+cleaned.slice(3,6);
        if(cleaned.length>=7) formatted+='-'+cleaned.slice(6,10);
        phoneInput.value = formatted;
      });
    }

    // --- TOTAL ---
    const totalDisplay = document.getElementById('total');
    function updateTotal(){
      let total=0;
      document.querySelectorAll('.order-quantity').forEach(input=>{
        total += (parseInt(input.value)||0) * (parseFloat(input.dataset.price)||0);
      });
      totalDisplay.innerText = `Total: $${total.toFixed(2)}`;
    }
    document.querySelectorAll('.order-quantity').forEach(input=>{
      input.addEventListener('input',updateTotal);
    });
    updateTotal();

    // --- GENERATE QR ---
    const qrContainer = document.getElementById('qr');
    document.getElementById('qrForm').addEventListener('submit', e=>{
      e.preventDefault();
      const formData = new FormData(document.getElementById('qrForm'));
      const values = [];
      let total=0;

      config.fields.forEach(f=>{
        if(f.type==='order'){
          f.groups.forEach(group=>{
            group.subSections.forEach(sub=>{
              sub.options.forEach(option=>{
                if(option.quantity_inline){
                  const qty = parseInt(formData.get(`${sub.name}_${option.name}`))||0;
                  values.push(qty);
                  total += qty*(parseFloat(option.price)||0);
                } else if(option.select_team_individual){
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
      qrContainer.innerHTML='';
      new QRCode(qrContainer, values.join('\t')+'\n');
    });

    // --- DOWNLOAD RECEIPT ---
    document.getElementById('downloadReceipt').addEventListener('click', ()=>{
      const formData = new FormData(document.getElementById('qrForm'));
      let receiptHTML = `<html><head><title>Order Receipt</title></head><body>`;
      receiptHTML += `<h2>Melich Photography Order Receipt</h2><ul>`;
      let total=0;

      config.fields.forEach(f=>{
        if(f.type==='order'){
          f.groups.forEach(group=>{
            let groupHTML = `<li><strong>${group.name}</strong><ul>`;
            group.subSections.forEach(sub=>{
              const hasQty = sub.options.some(opt=>{
                if(opt.quantity_inline){
                  return (parseInt(formData.get(`${sub.name}_${opt.name}`))||0)>0;
                } else if(opt.price && !opt.quantity_inline){
                  return true;
                }
                return false;
              });
              if(!hasQty) return;

              let subHTML=`<li>${sub.name}<ul>`;
              sub.options.forEach(opt=>{
                if(opt.quantity_inline){
                  const qty = parseInt(formData.get(`${sub.name}_${opt.name}`))||0;
                  if(qty>0){
                    const lineTotal = (qty*parseFloat(opt.price)).toFixed(2);
                    total+=parseFloat(lineTotal);
                    subHTML+=`<li>${opt.name} x${qty} - $${lineTotal}</li>`;
                  }
                } else if(opt.select_team_individual){
                  const sel = formData.get(`${sub.name}_${opt.name}`);
                  if(sel) subHTML+=`<li>${opt.name}: ${sel}</li>`;
                } else if(opt.price){
                  subHTML+=`<li>${opt.name} - $${opt.price}</li>`;
                }
              });
              subHTML+=`</ul></li>`;
              groupHTML+=subHTML;
            });
            groupHTML+=`</ul></li>`;
            receiptHTML+=groupHTML;
          });
        } else {
          const val=formData.get(f.code);
          if(val) receiptHTML+=`<li>${f.label}: ${val}</li>`;
        }
      });

      receiptHTML+=`</ul><p><strong>Total: $${total.toFixed(2)}</strong></p>`;
      receiptHTML+=`<div id="qrReceipt"></div></body></html>`;

      const tempDiv=document.createElement('div');
      tempDiv.innerHTML=receiptHTML;
      const qrDiv=tempDiv.querySelector('#qrReceipt');

      const qrText = Array.from(formData.entries()).map(([k,v])=>`${k}: ${v}`).join('\n');
      new QRCode(qrDiv,{ text: qrText, width:128, height:128 });

      const canvas = qrDiv.querySelector('canvas');
      if(canvas) qrDiv.innerHTML=`<img src="${canvas.toDataURL('image/png')}" alt="QR Code">`;

      const blob = new Blob([tempDiv.innerHTML],{ type:'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download='order_receipt.html';
      link.click();
    });

  })
  .catch(err=>{
    console.error('Error loading config:',err);
    document.getElementById('title').innerText='Error loading form';
  });
