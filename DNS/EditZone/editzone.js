const core = require('@actions/core');
const FormData = require('form-data');
const fetch = (...args) =>
    import ('node-fetch').then(({ default: fetch }) => fetch(...args));

const token = core.getInput('token');
const user = core.getInput('user');
const zone = core.getInput('zone');
const name = core.getInput('name');
const value = core.getInput('value');
const ttl = core.getInput('ttl');
const cpanelDNS = core.getInput('cpanelDNS');
const cpanelPort = core.getInput('cpanelPort');

const DNS_CPANEL = `${cpanelDNS}:${cpanelPort}`;

let Serial = 0;
const EditZone = (serial) =>
    fetch(`${DNS_CPANEL}/execute/DNS/mass_edit_zone`, {
            body: JSON.stringify({
                        "zone": zone,
                        "serial": serial,
                        "add": `{\"dname\": \"${name.replace(`.zone`,'')}\",\"ttl\": ${ttl},\"record_type\": \"CNAME\",\"line_index\": null,\"data\": [\"${value}\" ]}`
        }),
        headers: {
            Authorization: `cpanel ${user}:${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST"
    })


const AttZone = () =>
    fetch(`${DNS_CPANEL}/execute/DNS/parse_zone`, {
        body: JSON.stringify({
            "zone": zone,
        }),
        headers: {
            Authorization: `cpanel ${user}:${token}`,
            'Content-Type': 'application/json'
        },
        method: "POST"
    }).then(ResponseSerial => ResponseSerial.json().then(ResultSerial => {
        core.setOutput('success', true)

    }).catch(e => core.setFailed("To transform response into json")))
    .catch(e => core.setFailed("Failed when trying to request certificate verification"))

const execute = async() => {
    await EditZone(Serial).then(ResponseSerial => ResponseSerial.json().then(ResultSerial => {
            if (ResultSerial.errors != null) {
                Serial = ResultSerial.errors[0].match(/([0-9])\w+/g)[0]
                EditZone(Serial).then(ResponseSerial => ResponseSerial.json().then(ResultSerial => {
                        if (ResultSerial.errors == null) {
                            AttZone()
                        }
                    }).catch(e => core.setFailed("To transform response into json")))
                    .catch(e => core.setFailed("Failed when trying to request certificate verification"))
            }
        }).catch(e => core.setFailed("To transform response into json")))
        .catch(e => core.setFailed("Failed when trying to request certificate verification"))
}
execute();