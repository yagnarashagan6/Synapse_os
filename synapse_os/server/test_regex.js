const url1 = 'https://www.instagram.com/nike/?hl=en';
const url2 = 'https://instagram.com/nike';
const url3 = 'https://www.instagram.com/nike/';

function extractUsername(url) {
    const match = url.match(/instagram\.com\/([^/?]+)/);
    return match ? match[1] : null;
}

console.log(url1, '->', extractUsername(url1));
console.log(url2, '->', extractUsername(url2));
console.log(url3, '->', extractUsername(url3));
