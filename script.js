// Firebase конфигурация (данные, предоставленные вами)
const firebaseConfig = {
    apiKey: "AIzaSyDXGgwXcr-LjqcIbbTUPXo64tx-jzRQX7M",
    authDomain: "final-8cb8b.firebaseapp.com",
    projectId: "final-8cb8b",
    storageBucket: "final-8cb8b.appspot.com",
    messagingSenderId: "1089253676428",
    appId: "1:1089253676428:web:ae0a0bd5feb0472b1ff2a9",
    measurementId: "G-692EHLF595"
  };
  
  // Инициализация Firebase
  firebase.initializeApp(firebaseConfig);
  // firebase.analytics(); // Удалено, так как SDK Analytics не подключен
  
  // Получение ссылки на Realtime Database
  const database = firebase.database();
  
  // Инициализация канваса и контекста
  const mannequinCanvas = document.getElementById('mannequinCanvas');
  const ctx = mannequinCanvas.getContext('2d');
  const colorPicker = document.getElementById('color-picker');
  let fillEnabled = false;
  let totalPrice = 0;
  let currentRotation = 0;
  let isDragging = false;
  let startX;
  let draggedPocket = null;
  let offsetX = 0;
  let offsetY = 0;
  
  // История для Undo/Redo
  let undoStack = [];
  let redoStack = [];
  
  // Загрузка изображения модели
  const image = new Image();
  image.src = 'img/41255938_1920.png'; // Убедитесь, что путь к изображению корректен
  image.onload = () => {
      ctx.fillStyle = '#FFFFFF'; // Заполнение белым фоном
      ctx.fillRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
      ctx.drawImage(image, 0, 0, mannequinCanvas.width, mannequinCanvas.height);
      saveState(); // Сохранение начального состояния
  };
  image.onerror = () => {
      console.error('Не удалось загрузить изображение модели.');
  };
  
  // Функции открытия и закрытия модальных окон
  function openModal() {
      document.getElementById('modal').style.display = 'block';
      showTooltip('choose-pocket-tip', 'Выберите карман из галереи', 'right', document.querySelector('.add-pocket-container'));
  }
  
  function closeModal() {
      document.getElementById('modal').style.display = 'none';
      hideTooltip('choose-pocket-tip');
  }
  
  function openMaterialsModal() {
      document.getElementById('materialsModal').style.display = 'block';
  }
  
  function closeMaterialsModal() {
      document.getElementById('materialsModal').style.display = 'none';
  }
  
  function openStylesModal() {
      document.getElementById('stylesModal').style.display = 'block';
  }
  
  function closeStylesModal() {
      document.getElementById('stylesModal').style.display = 'none';
  }
  
  function openApronsModal() {
      document.getElementById('apronsModal').style.display = 'block';
  }
  
  function closeApronsModal() {
      document.getElementById('apronsModal').style.display = 'none';
  }
  
  function openTryOnModal() {
      document.getElementById('tryOnModal').style.display = 'block';
  }
  
  function closeTryOnModal() {
      document.getElementById('tryOnModal').style.display = 'none';
  }
  
  function openGalleryModal() {
      document.getElementById('galleryModal').style.display = 'block';
  }
  
  function closeGalleryModal() {
      document.getElementById('galleryModal').style.display = 'none';
  }
  
  function openTextModal() {
      document.getElementById('textModal').style.display = 'block';
  }
  
  function closeTextModal() {
      document.getElementById('textModal').style.display = 'none';
  }
  
  function openSaveModal() {
      document.getElementById('saveModal').style.display = 'block';
  }
  
  function closeSaveModal() {
      document.getElementById('saveModal').style.display = 'none';
  }
  
  function openOrderModal() {
      document.getElementById('orderModal').style.display = 'block';
  }
  
  function closeOrderModal() {
      document.getElementById('orderModal').style.display = 'none';
  }
  
  // Функция включения заливки
  function enableFill() {
      fillEnabled = true;
      mannequinCanvas.style.cursor = 'crosshair';
      showTooltip('fill-tip', 'Щелкните, чтобы залить цветом', 'top', mannequinCanvas);
  }
  
  // Функция отключения заливки
  function disableFill() {
      fillEnabled = false;
      mannequinCanvas.style.cursor = 'default';
      hideTooltip('fill-tip');
  }
  
  // Функции заливки (flood fill)
  function floodFill(x, y, fillColor, tempCtx = ctx) {
      const canvasWidth = mannequinCanvas.width;
      const canvasHeight = mannequinCanvas.height;
      const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imageData.data;
      const targetColor = getColorAtPixel(data, x, y, canvasWidth);
      if (colorsMatch(data, (y * canvasWidth + x) * 4, targetColor)) {
          const fillStack = [[x, y]];
  
          while (fillStack.length) {
              const [currentX, currentY] = fillStack.pop();
              const pixelIndex = (currentY * canvasWidth + currentX) * 4;
  
              if (colorsMatch(data, pixelIndex, targetColor)) {
                  setPixelColor(data, pixelIndex, fillColor);
  
                  if (currentX + 1 < canvasWidth) fillStack.push([currentX + 1, currentY]);
                  if (currentX - 1 >= 0) fillStack.push([currentX - 1, currentY]);
                  if (currentY + 1 < canvasHeight) fillStack.push([currentX, currentY + 1]);
                  if (currentY - 1 >= 0) fillStack.push([currentX, currentY - 1]);
              }
          }
  
          tempCtx.putImageData(imageData, 0, 0);
          saveState();
      }
  }
  
  function getColorAtPixel(data, x, y, width) {
      const pixelIndex = (y * width + x) * 4;
      return [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2], data[pixelIndex + 3]];
  }
  
  function setPixelColor(data, index, color) {
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = color[3];
  }
  
  function colorsMatch(data, index, color) {
      return data[index] === color[0] &&
             data[index + 1] === color[1] &&
             data[index + 2] === color[2] &&
             data[index + 3] === color[3];
  }
  
  // Функция преобразования HEX в RGB
  function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b, 255];
  }
  
  // Функция добавления кармана
  function addPocket(element) {
      const imgSrc = element.getAttribute('data-img-src');
      const pocketName = element.getAttribute('data-pocket-name');
      const price = parseInt(element.getAttribute('data-price'));
  
      const pocket = document.createElement('div');
      pocket.classList.add('pocket');
      pocket.style.width = `${document.getElementById('pocket-size').value}px`;
      pocket.style.height = `${document.getElementById('pocket-size').value}px`;
  
      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.width = '100%';
      pocket.appendChild(img);
  
      const deleteButton = document.createElement('div');
      deleteButton.textContent = '×';
      deleteButton.classList.add('delete-pocket');
      deleteButton.onclick = function() {
          removePocket(pocket, pocketName, price);
      };
      pocket.appendChild(deleteButton);
  
      pocket.style.left = '50%';
      pocket.style.top = '50%';
      pocket.style.transform = 'translate(-50%, -50%)';
      pocket.onmousedown = startDrag;
  
      pocket.addEventListener('click', (event) => {
          if (fillEnabled) {
              event.stopPropagation();
              const rect = pocket.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              const fillColor = hexToRgb(colorPicker.value);
              floodFillPocket(pocket, Math.floor(x), Math.floor(y), fillColor);
              disableFill();
              saveState();
          }
      });
  
      document.getElementById('mannequin').appendChild(pocket);
  
      totalPrice += price;
      updateReceipt(pocketName, price);
      updateTotalPrice();
  
      closeModal();
      saveState();
  }
  
  // Обработчик клика по канвасу для заливки
  mannequinCanvas.addEventListener('click', (event) => {
      if (fillEnabled && event.target === mannequinCanvas) {
          const rect = mannequinCanvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const fillColor = hexToRgb(colorPicker.value);
  
          // Создание временного канваса для белого фона
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = mannequinCanvas.width;
          tempCanvas.height = mannequinCanvas.height;
          const tempCtx = tempCanvas.getContext('2d');
  
          // Заполнение белым фоном
          tempCtx.fillStyle = '#FFFFFF';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
          // Отрисовка текущего дизайна на временном канвасе
          tempCtx.drawImage(mannequinCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
  
          // Заливка
          floodFill(Math.floor(x), Math.floor(y), fillColor, tempCtx);
  
          // Обновление основного канваса
          ctx.clearRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
  
          disableFill();
          saveState();
      }
  });
  
  // Функция заливки кармана
  function floodFillPocket(pocket, x, y, fillColor) {
      const canvas = document.createElement('canvas');
      canvas.width = pocket.clientWidth;
      canvas.height = pocket.clientHeight;
      const ctxPocket = canvas.getContext('2d');
  
      const img = new Image();
      img.src = pocket.querySelector('img').src;
      img.onload = () => {
          ctxPocket.drawImage(img, 0, 0, canvas.width, canvas.height);
  
          const imageData = ctxPocket.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const targetColor = getColorAtPixel(data, x, y, canvas.width);
          if (colorsMatch(data, (y * canvas.width + x) * 4, targetColor)) {
              const fillStack = [[x, y]];
  
              while (fillStack.length) {
                  const [currentX, currentY] = fillStack.pop();
                  const pixelIndex = (currentY * canvas.width + currentX) * 4;
  
                  if (colorsMatch(data, pixelIndex, targetColor)) {
                      setPixelColor(data, pixelIndex, fillColor);
  
                      if (currentX + 1 < canvas.width) fillStack.push([currentX + 1, currentY]);
                      if (currentX - 1 >= 0) fillStack.push([currentX - 1, currentY]);
                      if (currentY + 1 < canvas.height) fillStack.push([currentX, currentY + 1]);
                      if (currentY - 1 >= 0) fillStack.push([currentX, currentY - 1]);
                  }
              }
  
              ctxPocket.putImageData(imageData, 0, 0);
              pocket.querySelector('img').src = canvas.toDataURL();
              saveState();
          }
      };
      img.onerror = () => {
          console.error('Не удалось загрузить изображение кармана для заливки.');
      };
  }
  
  // Функции перетаскивания карманов
  function startDrag(event) {
      event.preventDefault();
      draggedPocket = event.target.closest('.pocket');
      const pocketRect = draggedPocket.getBoundingClientRect();
      const mannequinRect = document.getElementById('mannequin').getBoundingClientRect();
      offsetX = event.clientX - pocketRect.left;
      offsetY = event.clientY - pocketRect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  }
  
  function onMouseMove(event) {
      if (draggedPocket) {
          const mannequinRect = document.getElementById('mannequin').getBoundingClientRect();
          let newLeft = event.clientX - mannequinRect.left - offsetX;
          let newTop = event.clientY - mannequinRect.top - offsetY;
  
          // Предотвращение выхода за пределы манекена
          const pocketWidth = draggedPocket.offsetWidth;
          const pocketHeight = draggedPocket.offsetHeight;
          const mannequinWidth = mannequinRect.width;
          const mannequinHeight = mannequinRect.height;
  
          // Проверка границ
          if (newLeft < 0) newLeft = 0;
          if (newTop < 0) newTop = 0;
          if (newLeft + pocketWidth > mannequinWidth) newLeft = mannequinWidth - pocketWidth;
          if (newTop + pocketHeight > mannequinHeight) newTop = mannequinHeight - pocketHeight;
  
          draggedPocket.style.left = `${newLeft}px`;
          draggedPocket.style.top = `${newTop}px`;
      }
  }
  
  function onMouseUp() {
      if (draggedPocket) {
          saveState();
          draggedPocket = null;
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
  }
  
  // Обновление размера карманов
  function updatePocketSize(size) {
      const pockets = document.querySelectorAll('.pocket');
      pockets.forEach(pocket => {
          pocket.style.width = `${size}px`;
          pocket.style.height = `${size}px`;
      });
      saveState();
  }
  
  // Обновление чека
  function updateReceipt(name, price) {
      const item = document.createElement('div');
      item.textContent = `${name}: ${price} сум`;
      item.setAttribute('data-pocket-name', name);
      item.setAttribute('data-price', price);
      document.getElementById('receipt').appendChild(item);
  }
  
  // Обновление общей суммы
  function updateTotalPrice() {
      document.getElementById('total-price').textContent = `Сумма: ${totalPrice} сум`;
  }
  
  // Функция выбора материала
  function toggleMaterial(element, materialName, price) {
      if (element.checked) {
          totalPrice += price;
          const item = document.createElement('div');
          item.textContent = `${materialName}: ${price} сум`;
          item.setAttribute('data-material-name', materialName);
          item.setAttribute('data-price', price);
          document.getElementById('receipt').appendChild(item);
      } else {
          totalPrice -= price;
          const items = Array.from(document.getElementById('receipt').children);
          const item = items.find(i => i.getAttribute('data-material-name') === materialName);
          if (item) {
              item.remove();
          }
      }
      updateTotalPrice();
      saveState();
  }
  
  // Функция изменения фасона
  function changeStyle(styleSrc) {
      const newImage = new Image();
      newImage.src = styleSrc;
      newImage.onload = () => {
          ctx.clearRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.fillStyle = '#FFFFFF'; // Заполнение белым фоном
          ctx.fillRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.drawImage(newImage, 0, 0, mannequinCanvas.width, mannequinCanvas.height);
          resetDesignState();
          saveState();
      };
      newImage.onerror = () => {
          console.error('Не удалось загрузить изображение фасона.');
      };
  }
  
  // Функция изменения фартука
  function changeApron(apronSrc) {
      const newImage = new Image();
      newImage.src = apronSrc;
      newImage.onload = () => {
          ctx.clearRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.fillStyle = '#FFFFFF'; // Заполнение белым фоном
          ctx.fillRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.drawImage(newImage, 0, 0, mannequinCanvas.width, mannequinCanvas.height);
          resetDesignState();
          saveState();
      };
      newImage.onerror = () => {
          console.error('Не удалось загрузить изображение фартука.');
      };
  }
  
  // Функция удаления кармана
  function removePocket(pocket, pocketName, price) {
      pocket.remove();
      totalPrice -= price;
  
      const items = Array.from(document.getElementById('receipt').children);
      const item = items.find(i => i.getAttribute('data-pocket-name') === pocketName && parseInt(i.getAttribute('data-price')) === price);
      if (item) {
          item.remove();
      }
  
      updateTotalPrice();
      saveState();
  }
  
  // Функция сохранения в JPEG с белым фоном
  function saveAsJPEG() {
      // Создание временного канваса
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = mannequinCanvas.width;
      tempCanvas.height = mannequinCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
  
      // Заполнение белым фоном
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
      // Отрисовка основного канваса на временном канвасе
      tempCtx.drawImage(mannequinCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
  
      // Создание ссылки для скачивания
      const link = document.createElement('a');
      link.href = tempCanvas.toDataURL('image/jpeg');
      link.download = 'design.jpeg';
      link.click();
  }
  
  // Функция загрузки логотипа
  function uploadLogo(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
              const img = new Image();
              img.src = e.target.result;
              img.onload = function() {
                  const logo = document.createElement('div');
                  logo.classList.add('pocket');
                  logo.style.width = '100px';
                  logo.style.height = '100px';
  
                  const logoImg = document.createElement('img');
                  logoImg.src = img.src;
                  logoImg.style.width = '100%';
                  logo.appendChild(logoImg);
  
                  const deleteButton = document.createElement('div');
                  deleteButton.textContent = '×';
                  deleteButton.classList.add('delete-pocket');
                  deleteButton.onclick = function() {
                      logo.remove();
                      saveState();
                  };
                  logo.appendChild(deleteButton);
  
                  logo.style.left = '50%';
                  logo.style.top = '50%';
                  logo.style.transform = 'translate(-50%, -50%)';
                  logo.onmousedown = startDrag;
  
                  document.getElementById('mannequin').appendChild(logo);
                  saveState();
              };
              img.onerror = () => {
                  alert('Не удалось загрузить изображение логотипа.');
              };
          };
          reader.readAsDataURL(file);
      } else {
          alert('Пожалуйста, загрузите изображение.');
      }
  }
  
  // Функция добавления текста
  function submitText(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const text = formData.get('text');
      const font = formData.get('font');
      const color = formData.get('color');
      const size = formData.get('size');
      const letterSpacing = formData.get('letterSpacing');
      const lineHeight = formData.get('lineHeight');
      const fontStyle = formData.get('fontStyle');
  
      if (text) {
          const textElement = document.createElement('div');
          textElement.classList.add('pocket', 'text-element');
          textElement.style.width = 'auto';
          textElement.style.height = 'auto';
          textElement.style.color = color;
          textElement.style.backgroundColor = 'transparent';
          textElement.style.fontSize = `${size}px`;
          textElement.style.fontFamily = font;
          textElement.style.letterSpacing = `${letterSpacing}px`;
          textElement.style.lineHeight = `${lineHeight}`;
          textElement.style.fontStyle = fontStyle.includes('italic') ? 'italic' : 'normal';
          textElement.style.fontWeight = fontStyle.includes('bold') ? 'bold' : 'normal';
          if (fontStyle.includes('underline')) {
              textElement.style.textDecoration = 'underline';
          }
          textElement.style.padding = '5px';
          textElement.textContent = text;
  
          const deleteButton = document.createElement('div');
          deleteButton.textContent = '×';
          deleteButton.classList.add('delete-pocket');
          deleteButton.onclick = function() {
              textElement.remove();
              saveState();
          };
          textElement.appendChild(deleteButton);
  
          textElement.style.left = '50%';
          textElement.style.top = '50%';
          textElement.style.transform = 'translate(-50%, -50%)';
          textElement.onmousedown = startDrag;
  
          document.getElementById('mannequin').appendChild(textElement);
          saveState();
      }
  
      closeTextModal();
  }
  
  // Управление историей (Undo/Redo)
  function saveState() {
      const state = {
          pockets: Array.from(document.querySelectorAll('.pocket')).map(pocket => ({
              html: pocket.outerHTML,
              left: pocket.style.left,
              top: pocket.style.top,
              width: pocket.style.width,
              height: pocket.style.height
          })),
          totalPrice: totalPrice,
          receipt: document.getElementById('receipt').innerHTML,
          canvasImage: mannequinCanvas.toDataURL()
      };
      undoStack.push(state);
      redoStack = [];
  }
  
  function loadState(state) {
      resetDesign(false);
      document.getElementById('receipt').innerHTML = state.receipt;
      state.pockets.forEach(pocketData => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = pocketData.html;
          const pocket = tempDiv.firstChild;
          pocket.style.left = pocketData.left;
          pocket.style.top = pocketData.top;
          pocket.style.width = pocketData.width;
          pocket.style.height = pocketData.height;
          pocket.onmousedown = startDrag;
          pocket.addEventListener('click', (event) => {
              if (fillEnabled) {
                  event.stopPropagation();
                  const rect = pocket.getBoundingClientRect();
                  const x = event.clientX - rect.left;
                  const y = event.clientY - rect.top;
                  const fillColor = hexToRgb(colorPicker.value);
                  floodFillPocket(pocket, Math.floor(x), Math.floor(y), fillColor);
                  disableFill();
                  saveState();
              }
          });
          document.getElementById('mannequin').appendChild(pocket);
      });
  
      // Восстановление канваса
      const img = new Image();
      img.src = state.canvasImage;
      img.onload = () => {
          ctx.clearRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.fillStyle = '#FFFFFF'; // Заполнение белым фоном
          ctx.fillRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
          ctx.drawImage(img, 0, 0, mannequinCanvas.width, mannequinCanvas.height);
      };
      img.onerror = () => {
          console.error('Не удалось загрузить изображение канваса при восстановлении состояния.');
      };
  
      totalPrice = state.totalPrice;
      updateTotalPrice();
  }
  
  function undo() {
      if (undoStack.length > 1) { // Оставляем начальное состояние
          const currentState = undoStack.pop();
          redoStack.push(currentState);
          const previousState = undoStack[undoStack.length - 1];
          loadState(previousState);
      }
  }
  
  function redo() {
      if (redoStack.length > 0) {
          const nextState = redoStack.pop();
          undoStack.push(nextState);
          loadState(nextState);
      }
  }
  
  // Функция сброса дизайна
  function resetDesign(save = true) {
      ctx.clearRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
      ctx.fillStyle = '#FFFFFF'; // Заполнение белым фоном
      ctx.fillRect(0, 0, mannequinCanvas.width, mannequinCanvas.height);
      ctx.drawImage(image, 0, 0, mannequinCanvas.width, mannequinCanvas.height);
      document.querySelectorAll('.pocket').forEach(pocket => pocket.remove());
      totalPrice = 0;
      updateTotalPrice();
      document.getElementById('receipt').innerHTML = '<h3>Чек:</h3>';
      if (save) {
          undoStack = [];
          redoStack = [];
          saveState();
      }
  }
  
  // Функция оформления заказа
  function placeOrder() {
      openOrderModal();
  }
  
  // Функция отправки заказа
  function submitOrder(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const name = formData.get('name');
      const size = formData.get('size');
      const quantity = formData.get('quantity');
      const notes = formData.get('notes');
  
      // Сбор данных заказа
      const orderData = {
          name: name,
          size: size,
          quantity: quantity,
          notes: notes,
          totalPrice: totalPrice,
          timestamp: firebase.database.ServerValue.TIMESTAMP
      };
  
      // Сохранение заказа в Realtime Database
      const ordersRef = database.ref('orders');
      const newOrderRef = ordersRef.push();
      newOrderRef.set(orderData, (error) => {
          if (error) {
              alert('Ошибка при сохранении заказа. Пожалуйста, попробуйте позже.');
              console.error('Ошибка при сохранении заказа:', error);
          } else {
              alert('Заказ успешно оформлен!');
              closeOrderModal();
              resetDesign();
              generatePDF(); // Генерация PDF после успешного оформления заказа
          }
      });
  }
  
  // Функция отправки заказа на дашборд (пример)
  function sendOrderToDashboard(orderData) {
      if (window.opener) {
          console.log("Sending order data:", orderData);
          window.opener.postMessage({
              type: 'new-order',
              order: orderData
          }, '*');
      } else {
          console.error("No opener window found to send order data.");
      }
  }
  
  // Функция обработки отправки формы заказа
  function submitOrderForm() {
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const note = document.getElementById('note').value;
      const deposit = document.getElementById('deposit').value;
      const total = document.getElementById('total').value;
      const deadline = document.getElementById('deadline').value;
      
      const orderData = {
          name,
          phone,
          note,
          deposit,
          total,
          deadline
      };
  
      sendOrderToDashboard(orderData);
      alert("Заказ отправлен!");
      document.getElementById('orderForm').remove();
  }
  
  // Функции для подсказок
  function showTooltip(id, text, position, target) {
      let tooltip = document.getElementById(id);
      if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = id;
          tooltip.className = 'tooltip tooltip-' + position;
          tooltip.textContent = text;
          document.body.appendChild(tooltip);
      }
  
      const rect = target.getBoundingClientRect();
      tooltip.style.display = 'block';
  
      // Вычисление позиции
      if (position === 'top') {
          tooltip.style.left = rect.left + window.scrollX + (rect.width - tooltip.offsetWidth) / 2 + 'px';
          tooltip.style.top = rect.top + window.scrollY - tooltip.offsetHeight - 10 + 'px';
      } else if (position === 'right') {
          tooltip.style.left = rect.right + window.scrollX + 10 + 'px';
          tooltip.style.top = rect.top + window.scrollY + (rect.height - tooltip.offsetHeight) / 2 + 'px';
      }
  
      // Показ анимации
      requestAnimationFrame(() => {
          tooltip.style.opacity = '1';
      });
  
      // Автоматическое скрытие через 5 секунд
      setTimeout(() => hideTooltip(id), 5000);
  }
  
  function hideTooltip(id) {
      const tooltip = document.getElementById(id);
      if (tooltip) {
          tooltip.style.opacity = '0';
          setTimeout(() => {
              tooltip.style.display = 'none';
          }, 300);
      }
  }
  
  // Начальная подсказка
  document.addEventListener('DOMContentLoaded', () => {
      showTooltip('add-pocket-tip', 'Нажмите, чтобы добавить карман', 'right', document.querySelector('.add-pocket-container'));
  });
  
  // Функция генерации PDF
  function generatePDF() {
      // Импортируем jsPDF из глобального объекта
      const { jsPDF } = window.jspdf;
  
      const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
      });
  
      // Параметры для изображения
      const imgWidth = 210; // Ширина A4 в мм
      const imgHeight = (mannequinCanvas.height / mannequinCanvas.width) * imgWidth;
  
      // Создание временного канваса для белого фона
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = mannequinCanvas.width;
      tempCanvas.height = mannequinCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
  
      // Заполнение белым фоном
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
      // Отрисовка основного канваса на временном канвасе
      tempCtx.drawImage(mannequinCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
  
      // Получение изображения в формате JPEG
      const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
  
      // Добавление изображения на первую страницу PDF
      doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  
      // Добавление второй страницы для чека
      doc.addPage();
  
      // Добавление заголовка
      doc.setFontSize(18);
      doc.text('Чек:', 10, 20);
  
      // Добавление деталей чека
      doc.setFontSize(12);
      const receipt = document.getElementById('receipt');
      const items = receipt.querySelectorAll('div');
      let y = 30;
      items.forEach(item => {
          const text = item.textContent;
          doc.text(text, 10, y);
          y += 10;
      });
  
      // Сохранение PDF
      doc.save('order_receipt.pdf');
  }
  