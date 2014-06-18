function onLoad()
{
  //update the value
  document.getElementById("idRequest").value = window.arguments[0].inn.usernameRequest;
  document.getElementById("idAuthor").value = window.arguments[0].inn.author;
}

function returnOk() 
{
  window.arguments[0].out = {conferm:true};
  return true;
}