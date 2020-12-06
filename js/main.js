// INIT GLOBAL VARIABLES :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//  canvas elements
    var cvs, ctx, download_cvs, download_ctx, read_cvs, read_ctx;
// ----------------------------------------------------------------------------
//  OG image related info
    var img, imgData, width, height;
    var imgName = '47FE08F8.jpg';
// ----------------------------------------------------------------------------
//  read-img related info
    var readImg, readImgData, readImg_width, readImg_height, readImgName, seed_read;
// ----------------------------------------------------------------------------
// download-img related info
    var downloadImgData;
// ----------------------------------------------------------------------------
//  user input
    var msg, pw;
//-----------------------------------------------------------------------------
//  shuffle pixel order
    var seed, indexOrder, readIndexOrder;
//-----------------------------------------------------------------------------
//  encryption storage
    var cipher;
    const startStr = 'hRRo~';
    const endStr = "CuL8r";
    var retrievedCipher, decodedMsg;
//-----------------------------------------------------------------------------
// loading
    var isLoading;
    var isBugsFree = true;
//-----------------------------------------------------------------------------
//  debug
    var debug = false;
    var demo = false;
    var analyze = false;


// CORE WORKFLOWS :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// Hide and provide download ---------------------------------------------------

function hide(msg, pw) {

    imgData = ctx.getImageData(0, 0, width, height);
    downloadImgData = ctx.getImageData(0, 0, width, height);

    var pre_cipher = encrypt(msg, pw);
    cipher = startStr + pre_cipher + endStr;

    if (cipher.length < (width * height)) {

        if (demo) {
            console.log('image dimensions: ' + width + ' x ' + height + '\nembed capacity: ' + (width * height) + ' char');
            console.log('message length: ' + msg.length + '\ncipher length: ' + cipher.length);
            console.log('image at ' + Math.round(((cipher.length / (width * height))/100) * 10000) + '% capacity');
        }

        if (debug) {
            console.log('cipher passed length check');
            console.log('cipher: ' + cipher);
        }
        generateSeed();
        if (isBugsFree) {
            indexOrder = shufflePixelOrder(width, height, seed);
            manipulateImageData();
            storeSeed();

            isLoading = false;
            drawOverlay(width, height);
            overlay_on();
        } else {
            isLoading = false;
            throw alert('Something went wrong on our end, please file bug to \n[hktaz at protonmail dot com]\n');
        }

    } else {
        isLoading = false;
        throw alert('Message too long.\nReduce message length, or use a bigger image.');
    }
}

// unhide and show message -------------------------------------------------------

function unhide(pw) {

    readImgData = read_ctx.getImageData(0, 0, readImg_width, readImg_height);

    seed_read = readSeed(readImg_width, readImg_height, pw);
    readIndexOrder = shufflePixelOrder(readImg_width, readImg_height, seed_read);

    readImageData();

    if (isBugsFree) {

        decodedMsg = decrypt(retrievedCipher, pw);
        if (debug) {
            console.log("decodedMsg: \n" + decodedMsg);
        }
        if (isBugsFree) {
            document.getElementById('retrievedMessage').innerHTML = decodedMsg;
            downloadImgData = readImgData;
            downloadImgData.data = readImgData.data;
            drawOverlay(readImg_width, readImg_height);

            if (isLoading) {
                if (debug) {
                    console.log('--end of unhide / ifLoading check--');
                }
                isLoading = false;
                overlay_on();
            } else {
                overlay_off();
            }
        }
    }
}


// SHUFFLE ORDER :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// seed generation --------------------------------------------------------------

function generateSeed() {

    if (debug) {
        console.log("----GEN SEED----");
    }

    var dateTime = new Date();
    // 16 digits dateTime
    seed =
        ("0000" + dateTime.getFullYear()).slice(6, 9) +
        ("00" + dateTime.getMonth()).slice(-2) +
        ("00" + dateTime.getDate()).slice(-2) +
        ("00" + dateTime.getHours()).slice(-2) +
        ("00" + dateTime.getMinutes()).slice(-2) +
        ("00" + dateTime.getSeconds()).slice(-2) +
        ("0000" + dateTime.getMilliseconds()).slice(-4);

    if (debug) {
        console.log("genSeed: " + seed);
    }
}


// hide seed in image ------------------------------------------------------------

function storeSeed() {

    if (debug) {
        console.log("----STORE SEED----");
    }
    var binary_seed = "";
    for (var i = 0; i < seed.length; i++) {
        let binary_char = parseInt(seed[i]).toString(2);
        binary_seed += ("0000" + binary_char).slice(-4);
    }

    let seedIndexOrder = shufflePixelOrder(width, height, pw);

    for (var i = 0; i < 64; i++) {
        let pixelIndex = (seedIndexOrder[i] * 4) + 1;

        let altered_bin_G = dec2bin(downloadImgData.data[pixelIndex]).substr(5);
        let seeded_bin_G = parseInt(altered_bin_G.replaceAt(0, binary_seed.charAt(i)), 2);
        altered_bin_G = parseInt(altered_bin_G, 2);

        if (altered_bin_G !== seeded_bin_G) {

            let OG_G = imgData.data[pixelIndex];
            let OG_bin_G = parseInt(dec2bin(OG_G).substr(5), 2);
            let delta = seeded_bin_G - OG_bin_G;

            if (Math.abs(delta) < 4 || OG_G - 3 < 0 || OG_G + 3 > 255) {

                delta = seeded_bin_G - altered_bin_G;
                downloadImgData.data[pixelIndex] += delta;

            } else if (Math.abs(delta) === 4) {

                downloadImgData.data[pixelIndex] = (Math.random() > 0.49) ? OG_G + 4 : OG_G - 4;

            } else {

                if (delta > 0) {
                    switch (delta) {
                        case 5: downloadImgData.data[pixelIndex] = (OG_G - 3);
                            break;
                        case 6: downloadImgData.data[pixelIndex] = (OG_G - 2);
                            break;
                        case 7: downloadImgData.data[pixelIndex] = (OG_G - 1);
                    }
                } else {
                    switch (delta) {
                        case -5: downloadImgData.data[pixelIndex] = (OG_G + 3);
                            break;
                        case -6: downloadImgData.data[pixelIndex] = (OG_G + 2);
                            break;
                        case -7: downloadImgData.data[pixelIndex] = (OG_G + 1);
                    }
                }
            }
        }
    }

    // test block
    if (debug) {
        readImgData = downloadImgData;
        readImgData.data = downloadImgData.data;
        seed_read = readSeed(width, height, pw);
        if (seed_read !== seed) {
            isBugsFree = false;
            overlay_off();
            throw alert('code side error, data not stored correctly. Please come back later.');
        }
    }
}


// retrieve seed in image ---------------------------------------------------------

function readSeed(width, height, pw) {

    if (debug) {
        console.log("----READ SEED----");
    }

    let seedIndexOrder = shufflePixelOrder(width, height, pw);

    var binary_seed = "";
    for (var i = 0; i < 64; i++) {

        let seed_pixelIndex = (seedIndexOrder[i] * 4) + 1;

        if (debug) {
            console.log("i: " + i + "\norder: " + seedIndexOrder[i] + "\nIndex: " + seed_pixelIndex);
            console.log("pixel value before toString(): \n" + readImgData.data[seed_pixelIndex]);
        }

        let binary_G = ("00000000" + readImgData.data[seed_pixelIndex].toString(2)).slice(-8);
        let bit = binary_G.charAt(5);
        binary_seed += bit;
    }

    var dec_seed = "";
    for (i = 0; i < binary_seed.length; i += 4) {
        let subStr = binary_seed.substr(i, 4);
        dec_seed += bin2dec(subStr).toString();
    }

    if (debug) {
        console.log("readSeed: " + dec_seed);
    }

    return dec_seed;
}


// get shuffled order ------------------------------------------------------------

function shufflePixelOrder(width, height, seed) {

    if (debug) {
        console.log("-GET SHUFFLE ORDER-");
    }

    // minus 64 pixels that store seed
    const totalIndex = (width * height) - 1;

    // pseudorandom generator seeded with user-provided password
    var randGen = new Math.seedrandom(seed);

    // Fisher-Yates Shuffle
    let indexOrder = [];
    for (var i = 0; i <= totalIndex; i++) {
        indexOrder[i] = i;
    }

    var randIndex, temp;
    for (i = totalIndex; i > 0; i--) {
        randIndex = Math.floor((i - 1) * randGen());
        temp = indexOrder[i];
        indexOrder[i] = indexOrder[randIndex];
        indexOrder[randIndex] = temp;
    }

    return indexOrder;
}


// LSB INSERTION :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

var test_start = 0;
var test_end = 10000;

// replace bits ---------------------------------------------------------------

function manipulateImageData() {

    if (debug) {
        console.log("----EMBED----");
    }

    const cipherLen = cipher.length;
    for (var i = 0; i < cipherLen; i++) {

        let charCode = cipher.charCodeAt(i);
        let binary_cipher = dec2bin(charCode);
        let RGB_i = getRGB(0, indexOrder[i]);

        let cipher_dec = [bin2dec(dec2bin(RGB_i[0]).replaceAt(5, binary_cipher.substr(0, 3))),
                          bin2dec(dec2bin(RGB_i[1]).replaceAt(6, binary_cipher.substr(3, 2))),
                          bin2dec(dec2bin(RGB_i[2]).replaceAt(5, binary_cipher.substr(5, 3)))];

        if (debug) {
            if (i > test_start && i < test_end) {
                console.log('currentIndex: ' + i + '\nactualPixel: ' + indexOrder[i]);
                console.log('charCode = ' + charCode + ' char = ' + String.fromCharCode(charCode) + ' should equals ' + cipher.charAt(i));
                console.log('binary cipher: ' + binary_cipher + '\ncipher dec value: ' + cipher_dec);
                console.log('Before R: ' + dec2bin(RGB_i[0]) + ' (' + RGB_i[0] + ')' +
                    '\nBefore G: ' + dec2bin(RGB_i[1]) + ' (' + RGB_i[1] + ')' +
                    '\nBefore B: ' + dec2bin(RGB_i[2]) + ' (' + RGB_i[2] + ')');
            }
        }

        for (var j = 0; j < 3; j++) {

            let delta = cipher_dec[j] - RGB_i[j];
            if (debug) {
                if (i > test_start && i < test_end){
                    console.log('j: ' + i + ' delta = ' + delta);
                }
            }

            if (Math.abs(delta) < 4 || RGB_i[j] - 4 < 0 || RGB_i[j] + 4 > 255) {

                RGB_i[j] += delta;


            } else if (Math.abs(delta) === 4) {

                RGB_i[j] = (Math.random() > 0.499) ? RGB_i[j] + 4 : RGB_i[j] - 4;

            } else {

                if (delta > 0) {

                    switch (delta) {
                        case 7: RGB_i[j] -= 1;
                            break;
                        case 6: RGB_i[j] -= 2;
                            break;
                        case 5: RGB_i[j] -= 3;
                            break;
                    }

                } else {

                    switch (delta) {
                        case -7: RGB_i[j] += 1;
                            break;
                        case -6: RGB_i[j] += 2;
                            break;
                        case -5: RGB_i[j] += 3;
                            break;
                    }
                }
            }
            if (debug) {
                if (i > test_start && i < test_end){
                    console.log('RGB_i[j] = ' + RGB_i[j]);
                }
            }
        }

        setRGB(indexOrder[i], RGB_i);

        if (debug) {
            if (i > test_start && i < test_end) {
                console.log('After R: ' + dec2bin(RGB_i[0]) + ' (' + RGB_i[0] + ')' +
                    '\nAfter G: ' + dec2bin(RGB_i[1]) + ' (' + RGB_i[1] + ')' +
                    '\nAfter B: ' + dec2bin(RGB_i[2]) + ' (' + RGB_i[2] + ')' +
                    '\nin OG img R: ' + imgData.data[indexOrder[i] * 4] +
                    '\nin DL img R: ' + downloadImgData.data[indexOrder[i] * 4]);
            }
        }
    }
}

// read bits ------------------------------------------------------------------

function readImageData () {

    if (debug) {
        console.log("----READ----");
    }

    var currentIndex;
    retrievedCipher = '';

    for (currentIndex = 0; currentIndex < 5; currentIndex++) {
        retrievedCipher += readPixel(currentIndex);
    }
    if (debug) {
        console.log('currentIndex (should be 5) = ' + currentIndex);
        console.log("first 5 char: " + retrievedCipher + " startStr: " + startStr);
    }

    if (retrievedCipher === startStr) {

        var last5Char = retrievedCipher;

        while (currentIndex < readIndexOrder.length && !(last5Char === endStr)) {

            let char = readPixel(currentIndex);
            retrievedCipher += char;
            last5Char = last5Char.substr(1).concat(char);

            currentIndex++;
        }

    } else {
        isLoading = false;
        isBugsFree = false;
        overlay_off();
        throw alert('Something went wrong. \nIncorrect password, or image does not contain a secret message, or hidden data damaged (common for images that were compressed when being sent).');
    }

    if (debug) {
        console.log("out of loop - \nretrieved cipher: \n\n" + retrievedCipher);
    }

    retrievedCipher = retrievedCipher.substr(5);
    retrievedCipher = retrievedCipher.substr(0, retrievedCipher.length - endStr.length);

    if (debug) {
        console.log("\ncipher w/out start & end str: \n\n" + retrievedCipher);
    }
}


// LSB helpers ----------------------------------------------------------------

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement +
        this.substr(index + replacement.length);
}

function readPixel(currentIndex) {
    if (debug) {
        if (currentIndex > 400 && currentIndex < 600) {
            console.log('_readPixel entered\n\n');
        }
    }
    let actualPixel = readIndexOrder[currentIndex];
    var RGB_i = getRGB(1, actualPixel);

    if (debug) {
        if (currentIndex > test_start && currentIndex < test_end) {
            console.log('currentIndex: ' + currentIndex + '\nactualPixel: ' + actualPixel);
            console.log('\nRGB_i: ' + RGB_i +
                '\nR: ' + dec2bin(RGB_i[0]) + " (" + RGB_i[0] + ") " +
                '\nG: ' + dec2bin(RGB_i[1]) + " (" + RGB_i[1] + ") " +
                '\nB: ' + dec2bin(RGB_i[2]) + " (" + RGB_i[2] + ") ");
        }
    }

    let binary_R = dec2bin(RGB_i[0]).substr(5, 3);
    let binary_G = dec2bin(RGB_i[1]).substr(6, 2);
    let binary_B = dec2bin(RGB_i[2]).substr(5, 3);

    let bitBucket = [binary_R, binary_G, binary_B].join('');

    let dec = bin2dec(bitBucket);
    let char = String.fromCharCode(dec);

    if (debug) {
        if (currentIndex > test_start && currentIndex < test_end) {
            console.log(
                '\nR from img: ' + readImgData.data[actualPixel * 4] +
                '\nR_i: ' + RGB_i[0] +
                '\n' +
                '\nbitBucket: ' + bitBucket +
                '\ndec from bucket: ' + dec +
                '\nchar from dec: ' + char +
                '\ncipher:' + retrievedCipher);
        }
    }
    return char;
}

function getRGB(mode, index) {
    var RGB = [];
    if (mode === 0) {

        for (var i = 0; i < 3; i++) {
            RGB[i] = imgData.data[(index * 4) + i];
        }
        return RGB;

    } else {
        if (debug) {
            console.log('getRGB - readImgData loop');
        }
        for (var i = 0; i < 3; i++) {
            RGB[i] = readImgData.data[(index * 4) + i];
        }
        return RGB;
    }
}

function setRGB(index, RGB_array) {
    for (var i = 0; i < 3; i++) {
        downloadImgData.data[(index * 4) + i] = RGB_array[i];
    }
}

function dec2bin(decimal) {
    let str = decimal.toString(2);
    return ("00000000" + str).slice(-8);
}

function bin2dec(bin) {
    return parseInt(bin, 2);
}


// Crypto block :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


var keySize = 256;
var ivSize = 128;
var iterations = 128;

function encrypt (msg, pw) {

    var salt = CryptoJS.lib.WordArray.random(128/8);

    var key = CryptoJS.PBKDF2(pw, salt, {
        keySize: keySize/32,
        iterations: iterations
    });

    var iv = CryptoJS.lib.WordArray.random(128/8);

    var encrypted = CryptoJS.AES.encrypt(msg, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC

    });

    var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();

    return transitmessage;
}

function decrypt (cipher, pw) {

    var salt = CryptoJS.enc.Hex.parse(cipher.substr(0, 32));

    var iv = CryptoJS.enc.Hex.parse(cipher.substr(32, 32));

    var encrypted = cipher.substring(64);

    var key = CryptoJS.PBKDF2(pw, salt, {
        keySize: keySize/32,
        iterations: iterations
    });

    var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC

    })

    var text = decrypted.toString(CryptoJS.enc.Utf8);

    return text;
}


// FRONTEND LISTENERS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


// global variables -----------------------------------------------------------

var currentPage = 0;
var overlayOn = false;

// Init -----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);

function init() {
    showPage(currentPage);

    // pre-load default images
    img = new Image();
    img.onload = draw;
    img.src = "images/47FE08F8.jpg";
    document.getElementById('img_info').innerHTML = "default image";

    readImg = new Image();
    readImg.onload = drawRead;
    readImg.src = "images/placeholder_chaosLSB.png";
}

// wizard management -----------------------------------------------------------


function showPage(page) {
    let intro = document.getElementsByClassName('intro');
    let wiz = document.getElementsByClassName('wizard');

    for (var i = 0; i <= 2; i++) {
        if (i !== page) {
            intro[i].style.display = "none";
            wiz[i].style.display = "none";
        } else {
            intro[page].style.display = 'block';
            wiz[page].style.display = 'block';
        }
    }
    currentPage = page;
}


// image upload button pressed -------------------------------------------------

document.getElementById("upload").addEventListener("change", function (ev){
    if (this.files[0].name.substr(this.files[0].name.lastIndexOf('.') + 1) === 'HEIC'){
        var blob = ev.target.files[0];
        heic2any({
            blob: blob,
            toType: "image/png",
        })
            .then(function (resultBlob) {
                img = new Image();
                img.onload = draw;
                img.src = window.URL.createObjectURL(resultBlob);
            })
            .catch(function (x) {
                document.getElementById("error-on-try").style.display = "block";
                document.getElementById("error-on-try").innerHTML =
                    "Error code: <code>" + x.code + "</code> " + x.message;
            });
    } else {
        img = new Image();
        img.onload = draw;
        img.src = URL.createObjectURL(this.files[0]);
    }
    imgName = this.files[0].name;
    document.getElementById('putFileName').innerHTML = "  " + imgName;
    document.getElementById('img_info').innerHTML = "uploaded image";
});

/*document.getElementById('upload').onchange = function(e) {
    img = new Image();
    var url;
    if (this.files[0].name.substr(this.files[0].name.lastIndexOf('.') + 1) === 'HEIC' ||
        this.files[0].name.substr(this.files[0].name.lastIndexOf('.') + 1) === 'heic') {

        document.getElementById("img_info").innerHTML = "";
        document.getElementById("img_info").style.display = "none";
        var blob = e.target.files[0];
        heic2any({
            blob: blob,
            toType: "image/png",
        })
            .then(function (resultBlob) {
                url = window.URL.createObjectURL(resultBlob);
            })
            .catch(function (x) {
                document.getElementById("img_info").style.display = "block";
                document.getElementById("img_info").innerHTML =
                    "Error code: <code>" + x.code + "</code> " + x.message;
            });
    } else {
        url = URL.createObjectURL(this.files[0]);
    }
    img.src = url;
    img.onload = draw;
    img.onerror = uploadFail;
    imgName = this.files[0].name;
    document.getElementById('putFileName').innerHTML = "  " + imgName;
    document.getElementById('img_info').innerHTML = "uploaded image";
}*/

document.getElementById('read-img-upload').onchange = function(e) {
    readImg = new Image();
    readImg.onload = drawRead;
    readImg.src = URL.createObjectURL(this.files[0]);
    readImg.onerror = uploadFail;
    readImgName = this.files[0].name;
    document.getElementById('read_img_info').innerHTML = "uploaded image";
    document.getElementById('readFileName').innerHTML = "  " + readImgName;
    manageReadSubmit();
}

function uploadFail() {
    document.getElementsByTagName("imgError").innerHTML = "Upload failed... " +
        "\nPlease make sure to upload an image file, JPG and PNG are recommended.";
}

// draw canvas ------------------------------------------------------------------

function draw() {
    width = this.naturalWidth;
    height = this.naturalHeight;

    cvs = document.getElementById('canvas');
    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d');
    ctx.drawImage(this, 0, 0);

    document.getElementsByTagName("imgError").innerHTML = '';
}

function drawRead() {
    readImg_width = this.naturalWidth;
    readImg_height = this.naturalHeight;
    read_cvs = document.getElementById('read-img-canvas');
    read_cvs.width = readImg_width;
    read_cvs.height = readImg_height;
    read_ctx = read_cvs.getContext('2d');
    read_ctx.drawImage(this, 0, 0);

    document.getElementsByTagName("imgError").innerHTML = '';
}

function drawOverlay(width, height) {
    download_cvs = document.getElementById('downloadableCanvas');
    download_cvs.width = width;
    download_cvs.height = height;
    download_ctx = download_cvs.getContext('2d');
    download_ctx.putImageData(downloadImgData, 0, 0);
}

// submit button pressed ---------------------------------------------------------

document.getElementById('submit').onclick = function (e) {

    document.getElementById('img_info').innerHTML = "uploaded image";

    if (debug){
        console.log("after (!img) check ->\n" + img.src +
            "\nwidth: " + width + " height: " + height);
    }

    // 33.5% AES generated cipher overhead
    if ((document.getElementById('msg').
    value.toString().length) * 1.335 < (width * height)){
            msg = document.getElementById('msg').value;
            document.getElementById('userMessage').innerHTML = msg;
    } else {
            throw alert("Message too long. Shorten message, " +
                "or upload an image with higher resolution.");
    }

    pw = document.getElementById('pw').value;
    document.getElementById('password').innerHTML = pw;

    if (debug){
        console.log("msg: " + msg + "\npw: " + pw);
    }

    isLoading = true;
    overlay_on();
    isBugsFree = true;
    hide(msg, pw);
}

document.getElementById('read-submit').onclick = function (e) {
    pw = document.getElementById('read-pw').value;

    isLoading = true;
    overlay_on();
    isBugsFree = true;
    unhide(pw);
}


// adjust input boxes height --------------------------------------------------------------

function autoHeight(id) {
    let element = document.getElementById(id);
    element.style.height = '0px';
    element.style.height = element.scrollHeight + 'px';
}

// enable / disable submit button ---------------------------------------------------------

function manageSubmit() {
    let msg = document.getElementById('msg').value;
    let pw = document.getElementById('pw').value;
    if (msg && pw) {
        document.getElementById('submit').disabled = false;
    } else {
        document.getElementById('submit').disabled = true;
    }
}

function manageReadSubmit() {
    let readPw = document.getElementById('read-pw').value;
    if (readImg && readPw) {
        document.getElementById('read-submit').disabled = false;
    } else {
        document.getElementById('read-submit').disabled = true;
    }
}


// enable / disable overlay ----------------------------------------------------------------

function overlay_on() {
    if (debug) {
        console.log("----OVERLAY ON----");
        console.log("isLoading: " + isLoading);
    }
    overlayOn = true;

    let overlay = document.getElementsByClassName("overlay");
    overlay[0].style.display = "block";

    let overlayBG = document.getElementsByClassName('overlayBG');
    overlayBG[0].style.display = (isLoading === true) ? 'none' : 'block';
    overlayBG[1].style.display = (isLoading === true) ? 'block' : 'none';

    if (overlayBG[1].style.display === 'block'){

        if (debug) {
            console.log("block loop entered");
        }

        let text = document.getElementsByClassName('overlayContentText');
        text[0].style.display = (currentPage === 1) ? 'block' : 'none';
        text[1].style.display = (currentPage === 1) ? 'none'  : 'block';
    }

    let bottomLayer = document.getElementById('bottomLayer');
    bottomLayer.classList.toggle('noScroll', overlayOn);
}

function overlay_off() {
    overlayOn = false;

    let overlay = document.getElementsByClassName("overlay");
    overlay[0].style.display = "none";

    let bottomLayer = document.getElementById('bottomLayer');
    bottomLayer.classList.toggle('noScroll', overlayOn);
}


// download button pressed -----------------------------------------------------------------

function download() {
    var download = document.getElementById("download");
    var image =
        document.getElementById('downloadableCanvas')
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");

    var newImgName = imgName.substr(0, imgName.lastIndexOf('.')).concat('.png');

    download.setAttribute("href", image);
    download.setAttribute("download", newImgName);
}
function exportText() {
    var exportText = document.getElementById("exportText");
    exportText.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(decodedMsg));
    exportText.setAttribute("download", 'copy.txt');
}



