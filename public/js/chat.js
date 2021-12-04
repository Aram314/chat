const socket = io();

const input = document.getElementById('input');
const form = document.getElementById('form');
const submitButton = document.getElementById('submit');
const container = document.getElementById('container');
const sendLocationButton = document.getElementById('sendLocation');
const messageHtml = document.getElementById('message-template').innerHTML;
const locationMessageTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;
const sidebarContainer = document.querySelector('.chat__sidebar');

const { name, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submitButton.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', input.value, (errorMsg) => {
    submitButton.removeAttribute('disabled');
    input.value = '';
    input.focus();
    if (errorMsg) {
      return console.log(errorMsg);
    }
    console.log('Message delivered!');
  });
})

const autoScroll = () => {
  const newMessage = container.lastElementChild;
  const newMessageStyles = getComputedStyle(newMessage);
  const marginBottom = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + marginBottom;

  const visibleHeight = container.offsetHeight;
  const containerHeight = container.scrollHeight;
  const scrollOffset = container.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    container.scrollTop = container.scrollHeight;
  }

  console.log(newMessageHeight)
}

socket.on('message', (msg) => {
  const html = Mustache.render(messageHtml, {
    name: msg.name,
    message: msg.text,
    createdAt: moment(msg.createdAt).format('hh:mm a'),
  });
  container.insertAdjacentHTML('beforeend', html);
  console.log(html, typeof html);
  console.log(container);
  autoScroll();
})

socket.on('locationMessage', (msg) => {
  const html = Mustache.render(locationMessageTemplate, {
    name: msg.name,
    message: msg.text,
    createdAt: moment(msg.createdAt).format('hh:mm a'),
  });
  container.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })
  sidebarContainer.innerHTML = html
})

sendLocationButton.addEventListener('click', () => {
  sendLocationButton.setAttribute('disabled', 'disabled');

  if (!navigator.geolocation) {
    sendLocationButton.removeAttribute('disabled');
    return alert('Geolocation is not supported for your browser!')
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      long: position.coords.longitude,
      lat: position.coords.latitude,
    }, () => {
      sendLocationButton.removeAttribute('disabled');
      console.log('Location Shared');
    })
  });
})

socket.emit('join', {
  name,
  room,
}, (errorMsg) => {
  if (errorMsg) {
    alert(errorMsg);
    location.href = '/'
  }
})
