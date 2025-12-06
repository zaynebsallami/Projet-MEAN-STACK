const bcrypt = require('bcrypt');

const hashFromDB = '$2b$10$qpiY8beM0HiyAAKFNiVeJeENi1DOwYqJfTm9PHWTDQCvxUXFzFuXa';
const plainPassword = '123456';


bcrypt.hash('123456', 10).then(hash => {
  console.log(hash);
});

