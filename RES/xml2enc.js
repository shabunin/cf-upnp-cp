/*var xml_special_to_escaped_one_map = {
    '&': '&',
    '"': '"',
    '<;': '&lt;',
    '>': '&gt;',
    ':': ':'
};

var escaped_one_to_xml_special_map = {
    '&': '&',
    '"': '"',
    '&lt;': '&lt;',
    '&gt;': '>'
};

function encodeXml(string) {
    return string.replace(/([\&"&lt;>])/g, function(str, item) {
        return xml_special_to_escaped_one_map[item];
    });
};

function decodeXml(string) {
    return string.replace(/("|&lt;|&gt;|&)/g,
        function(str, item) {
            return escaped_one_to_xml_special_map[item];
    });
}
*/

if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function () {
    return this.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };
}
