
const holo_button = document.getElementById('hololensBtn');
holo_button.addEventListener('click', function(e) {
  console.log('button was clicked');
  fetch('/hololens', {method: 'GET'})
    .then(function(response) {
      if(response.ok) {
        console.log('Click was recorded');
        return response;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });
});

const webapp_button = document.getElementById('webappBtn');
webapp_button.addEventListener('click', function(e) {
  console.log('button was clicked');

  fetch('/webapp', {method: 'POST'})
    .then(function(response) {
      if(response.ok) {
        console.log('Click was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });
});