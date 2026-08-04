const params = new URLSearchParams(window.location.search);
const tableNumber = params.get("table") || "1";
document.getElementById("tableNumber").textContent = tableNumber;

const qrImg = document.getElementById("tableQr");
if (qrImg && window.qrcode) {
  const url = location.origin + location.pathname + "?table=" + tableNumber;
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  qrImg.src = qr.createDataURL(4, 4);
  qrImg.alt = "QR code for table " + tableNumber;
}
