var registrationId = "";
var hubName        = "", connectionString = "";
var originalUri    = "", targetUri = "", endpoint = "", sasKeyName = "", sasKeyValue = "", sasToken = "";

window.onload = function() { 
   document.getElementById("registerWithGCM").onclick = registerWithGCM;  
   document.getElementById("registerWithNH").onclick = registerWithNH; 
   updateLog("You have not registered yet. Please provider sender ID and register with GCM and then Notifications Hub."); 
} 

function updateLog(status) {
  currentStatus = document.getElementById("console").innerHTML;
  if (currentStatus != "") {
    currentStatus = currentStatus + "\n\n";
  }

  document.getElementById("console").innerHTML = currentStatus  + status;
}

function registerWithGCM() {
  var senderId = document.getElementById("senderId").value.trim();
  chrome.gcm.register([senderId], registerCallback);

  // Prevent register button from being clicked again before the registration finishes
  document.getElementById("registerWithGCM").disabled = true;
}


function registerCallback(regId) {
  registrationId = regId;
  document.getElementById("registerWithGCM").disabled = false;

  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    updateLog("Registration failed: " + chrome.runtime.lastError.message);
    return;
  }

  updateLog("Registration with GCM succeeded.");
  document.getElementById("registerWithNH").disabled = false;

  // Mark that the first-time registration is done.
  chrome.storage.local.set({registered: true});
}

function registerWithNH() {
  hubName = document.getElementById("hubName").value.trim();
  connectionString = document.getElementById("connectionString").value.trim();
  splitConnectionString();
  generateSaSToken();
  sendNHRegistrationRequest();
}

// From http://msdn.microsoft.com/en-us/library/dn495627.aspx 
function splitConnectionString()
{
  var parts = connectionString.split(';');
  if (parts.length != 3)
  throw "Error parsing connection string";

  parts.forEach(function(part) {
    if (part.indexOf('Endpoint') == 0) {
    endpoint = 'https' + part.substring(11);
    } else if (part.indexOf('SharedAccessKeyName') == 0) {
    sasKeyName = part.substring(20);
    } else if (part.indexOf('SharedAccessKey') == 0) {
    sasKeyValue = part.substring(16);
    }
  });

  originalUri = endpoint + hubName;
}

function generateSaSToken()
{
  targetUri = encodeURIComponent(originalUri.toLowerCase()).toLowerCase();
  var expiresInMins = 10; // 10 minute expiration

  // Set expiration in seconds
  var expireOnDate = new Date();
  expireOnDate.setMinutes(expireOnDate.getMinutes() + expiresInMins);
  var expires = Date.UTC(expireOnDate.getUTCFullYear(), expireOnDate
    .getUTCMonth(), expireOnDate.getUTCDate(), expireOnDate
    .getUTCHours(), expireOnDate.getUTCMinutes(), expireOnDate
    .getUTCSeconds()) / 1000;
  var tosign = targetUri + '\n' + expires;

  // using CryptoJS
  var signature = CryptoJS.HmacSHA256(tosign, sasKeyValue);
  var base64signature = signature.toString(CryptoJS.enc.Base64);
  var base64UriEncoded = encodeURIComponent(base64signature);

  // construct authorization string
  sasToken = "SharedAccessSignature sr=" + targetUri + "&sig="
                  + base64UriEncoded + "&se=" + expires + "&skn=" + sasKeyName;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function sendNHRegistrationRequest()
{
  var registrationPayload = '{"installationId": "{GCMRegistrationId}", "platform":"gcm", "pushChannel":"{GCMRegistrationId}"}';

  registrationPayload = registrationPayload.replaceAll("{GCMRegistrationId}", registrationId);

  var url = originalUri + "/installations/12345?api-version=2015-01";
  var client = new XMLHttpRequest();

  client.onload = function () {
    if (client.readyState == 4) {
      if (client.status == 200) {
        updateLog("Notification Hub Registration succesful!");
        updateLog(registrationPayload);
        updateLog(client.responseText);
      } else {
        updateLog("Notification Hub Registration did not succeed!");
        updateLog("HTTP Status: " + client.status + " : " + client.statusText);
        updateLog("HTTP Response: " + "\n" + client.responseText);
      }
    }
  };

  client.onerror = function () {
        updateLog("ERROR - Notification Hub Registration did not succeed!");
  }

  client.open("PUT", url, true);
  client.setRequestHeader("Content-Type", "application/json");
  client.setRequestHeader("Authorization", sasToken);
  client.setRequestHeader("x-ms-version", "2015-01");

  try {
      client.send(registrationPayload);
  }
  catch(err) {
      updateLog(err.message);
  }
}


