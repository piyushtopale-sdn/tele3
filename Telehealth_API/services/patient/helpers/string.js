const bcrypt = require("bcrypt");

function isEmpty(value) {
  return (
    value == "" ||
    value == null ||
    value == undefined ||
    value.toString().replace(/\s/g, "") == ""
  );
}

async function hashPassword(plaintextPassword) {
  const hash = await bcrypt.hash(plaintextPassword, 10);
  return hash;
}

// compare password
async function comparePassword(plaintextPassword, hash) {
  const result = await bcrypt.compare(plaintextPassword, hash);
  return result;
}

const generateMRNNumber = (length = 10) => {
  const chars = "0123456789";
  // Adjust length to account for the leading '1'
  const adjustedLength = length - 1; 
  const randomArray = Array.from(
      { length: adjustedLength },
      () => chars[Math.floor(Math.random() * chars.length)]
  );
  // Prepend '1' to the generated random string
  const randomString = "1" + randomArray.join("");
  return randomString;
}

function formatString(string) {
  const regexPattern = /\s+/g;
  const newString = string.replace(regexPattern, " ");
  return newString;
}

module.exports = {
  isEmpty,
  hashPassword,
  comparePassword,
  generateMRNNumber,
  formatString
};
