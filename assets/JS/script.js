const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");
const createAccount = document.getElementById("createAccount");
const signIntoAccount = document.getElementById("signIntoAccount");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");

  createAccount.style.borderLeft = "4px solid #004743"; // red
  createAccount.style.borderRight = "0px solid #00474300"; // blue

  signIntoAccount.style.borderLeft = "2px solid #004743"; // green
  signIntoAccount.style.borderRight = "2px solid #004743"; // yellow
});

signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");

  createAccount.style.borderLeft = "0px solid #00474300"; // red
  createAccount.style.borderRight = "2px solid #004743"; // blue

  signIntoAccount.style.borderLeft = "0px solid #00474300"; // green
  signIntoAccount.style.borderRight = "4px solid #004743"; // yellow
});
