const { readFileSync } = require('fs');
const { JSONPath } = require('jsonpath-plus');

module.exports.requestActions = [
  {
    label: 'Authorize requests',
    icon: 'fa-unlock',
    action: async (context, data) => {
      const { app: { alert }, network: { sendRequest }, store: { setItem } } = context;
      const { request } = data;

      const response = await sendRequest(request);
      let token;

      if (![200, 201].includes(response.statusCode)) {
        alert('', `Request failed [${response.statusCode} ${response.statusMessage}]`);
        return;
      }

      const tokenRequestHeader = request.headers.find(header => header.name === 'TokenResponseHeader');
      const JSONPathFilterRequestHeader = request.headers.find(header => header.name === 'JSONPath-filter');

      if (tokenRequestHeader) {
        token = response.headers.find(header => header.name === tokenRequestHeader.value)?.value;
      }

      if (JSONPathFilterRequestHeader) {
        const json = JSON.parse(readFileSync(response.bodyPath, 'utf8'));
        token = JSONPath({ json, path: JSONPathFilterRequestHeader.value });
      }

      if (!token?.length) {
        alert('', 'Could not get the access token. Please check that the "TokenResponseHeader" or the "JSONPath-filter" request header is present and its value is correct.');
        return;
      }

      setItem('access_token', token);

      alert('Success!', 'Access token saved successfully as <access_token> template variable.');
    },
  },
];

module.exports.templateTags = [
  {
    name: 'access_token',
    description: 'Access token from authorize request',
    async run (context) {
      const { store: { getItem } } = context;
      return getItem('access_token');
    }
  }
];