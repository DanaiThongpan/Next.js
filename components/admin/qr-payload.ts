// PHP urlencode: RFC1738 form encoding, including space as + and escaped ~.
export function qrPayload(base:string, number:string) {
 return base+encodeURIComponent(number).replace(/[!'()*~]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
}
