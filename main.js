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

      if (![200, 201].includes(response.statusCode)) {
        alert('', `Request failed [${response.statusCode} ${response.statusMessage}]`);
        return;
      }

      const json = JSON.parse(readFileSync(response.bodyPath, 'utf8'));
      const path = request.headers.filter(header => header.name === 'JSONPath-filter')[0].value;
      const token = JSONPath({ json, path });

      if (!token.length) {
        alert('', 'Could not find the access token in response. Please check "JSONPath-filter" request header.');
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