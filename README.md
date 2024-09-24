# fsh-chef

## Content

[Convert from FSH to FHIR](#-Convert-from-FSH-to-FHIR)

[Convert from FHIR to FSH](#-Convert-from-FHIR-to-FSH)

[Convert from FSH to FHIR v2](#-convert-from-fsh-to-fhir-v2)

[Convert from FHIR to FSH v2](#-convert-from-fhir-to-fsh-v2)



#### Demo:

- https://demo.termx.org/chef/fsh2fhir
- https://demo.termx.org/chef/v2/fsh2fhir
- https://demo.termx.org/chef/fhir2fsh
- https://demo.termx.org/chef/v2/fhir2fsh



## Convert from FSH to FHIR

```url
http://localhost:3000/fsh2fhir
```

### Example request

cURL request:

```bash
curl --request POST \
  --url http://localhost:3000/fsh2fhir \
  --header 'content-type: application/json; version=0.0.1' \
  --header 'user-agent: vscode-restclient' \
  --data-binary '@./request.json'
```

request.json file content:

```
{
    "fsh": "Logical: TermXBloodPressure\r\nParent: Element\r\nId: TermXBloodPressure\r\n* ^url = \"https://termx.org/Model/BloodPressure\"\r\n* ^publisher = \"TermX\"\r\n* ^status = #draft\r\n* patient 1..1 Reference(http://hl7.org/fhir/StructureDefinition/Patient) \"Patient\" \"Subject of procedure.\"\r\n* performer 0..1 Reference(http://hl7.org/fhir/StructureDefinition/Practitioner or http://hl7.org/fhir/StructureDefinition/PractitionerRole) \"Performer\" \"The people who performed the procedure.\"\r\n* performed 1..1 dateTime \"Effective time\" \"When the procedure was performed.\"\r\n* position 1..1 Coding \"The position of the individual at the time of measurement.\" \"The position of the individual at the time of measurement.\"\r\n* systolic 1..1 Quantity \"The actual numeric result of systolic blood pressure.\" \"The actual numeric result of systolic blood pressure.\"\r\n* diastolic 1..1 Quantity \"The actual numeric result of diastolic blood pressure.\" \"The actual numeric result of diastolic blood pressure.\"\r\n* note 0..1 string \"Comments about the observation\" \"Comments about the observation\"",
    "options": {}
}
```

Note! You can use JSON.stringify(json) to get the text for the "fsh" value, or any online service like [JSON Stringify Online using JSON.Stringify()](https://jsonformatter.org/json-stringify-online)

## Convert from FHIR to FSH

```url
http://localhost:3000/fhir2fsh
```

### Example request

cURL request:

```bash
curl --request POST \
  --url http://localhost:3000/fhir2fsh \
  --header 'content-type: application/json; version=0.0.1' \
  --header 'user-agent: vscode-restclient' \
  --data-binary '@./request.json'
```

request.json file content:

```
{
    "fhir": ["{\"resourceType\":\"StructureDefinition\",\"id\":\"TermXBloodPressure\",\"url\":\"https://termx.org/Model/BloodPressure\",\"version\":\"1.0.0\",\"name\":\"TermXBloodPressure\",\"status\":\"draft\",\"publisher\":\"TermX\",\"fhirVersion\":\"5.0.0\",\"kind\":\"logical\",\"abstract\":false,\"type\":\"https://termx.org/Model/BloodPressure\",\"baseDefinition\":\"http://hl7.org/fhir/StructureDefinition/Element\",\"derivation\":\"specialization\",\"differential\":{\"element\":[{\"id\":\"BloodPressure\",\"path\":\"BloodPressure\",\"short\":\"TermXBloodPressure\",\"definition\":\"TermXBloodPressure\"},{\"id\":\"BloodPressure.patient\",\"path\":\"BloodPressure.patient\",\"short\":\"Patient\",\"definition\":\"Subject of procedure.\",\"min\":1,\"max\":\"1\",\"type\":[{\"code\":\"Reference\",\"targetProfile\":[\"http://hl7.org/fhir/StructureDefinition/Patient\"]}]},{\"id\":\"BloodPressure.performer\",\"path\":\"BloodPressure.performer\",\"short\":\"Performer\",\"definition\":\"The people who performed the procedure.\",\"min\":0,\"max\":\"1\",\"type\":[{\"code\":\"Reference\",\"targetProfile\":[\"http://hl7.org/fhir/StructureDefinition/Practitioner\",\"http://hl7.org/fhir/StructureDefinition/PractitionerRole\"]}]},{\"id\":\"BloodPressure.performed\",\"path\":\"BloodPressure.performed\",\"short\":\"Effective time\",\"definition\":\"When the procedure was performed.\",\"min\":1,\"max\":\"1\",\"type\":[{\"code\":\"dateTime\"}]},{\"id\":\"BloodPressure.position\",\"path\":\"BloodPressure.position\",\"short\":\"The position of the individual at the time of measurement.\",\"definition\":\"The position of the individual at the time of measurement.\",\"min\":1,\"max\":\"1\",\"type\":[{\"code\":\"Coding\"}]},{\"id\":\"BloodPressure.systolic\",\"path\":\"BloodPressure.systolic\",\"short\":\"The actual numeric result of systolic blood pressure.\",\"definition\":\"The actual numeric result of systolic blood pressure.\",\"min\":1,\"max\":\"1\",\"type\":[{\"code\":\"Quantity\"}]},{\"id\":\"BloodPressure.diastolic\",\"path\":\"BloodPressure.diastolic\",\"short\":\"The actual numeric result of diastolic blood pressure.\",\"definition\":\"The actual numeric result of diastolic blood pressure.\",\"min\":1,\"max\":\"1\",\"type\":[{\"code\":\"Quantity\"}]},{\"id\":\"BloodPressure.note\",\"path\":\"BloodPressure.note\",\"short\":\"Comments about the observation\",\"definition\":\"Comments about the observation\",\"min\":0,\"max\":\"1\",\"type\":[{\"code\":\"string\"}]}]}}"],
    "options": {}
}
```

Note! **the "fhir" value is an array.**

Note! You can use JSON.stringify(json) to get the text for the "fhir" value, or any online service like [JSON Stringify Online using JSON.Stringify()](https://jsonformatter.org/json-stringify-online)

## Convert from FSH to FHIR v2

Service URL:

```url
http://localhost:3000/v2/fsh2fhir
```

"Content-type" header should be defined.

Format: application/fsh; [options]

Options:

- canonical (string),

- version (string),

- fhirVersion (string),

- logLevel (string) ["silly", "debug", "verbose", "http", "info", "warn", "error", "silent"];

- snapshot (boolean);

Example:

`content-type: application/fsh; version=0.0.1`

### Example request

cURL request:

```
curl --request POST --url http://localhost:3000/v2/fsh2fhir \
--header 'content-type: application/fsh; version=0.0.1' \
--header 'user-agent: vscode-restclient' \
--data-binary '@./BloodPressure.fsh'
```

BloodPressure.fsh file content:

```
Logical: TermXBloodPressure
Parent: Element
Id: TermXBloodPressure
* ^url = "https://termx.org/Model/BloodPressure"
* ^publisher = "TermX"
* ^status = #draft
* patient 1..1 Reference(http://hl7.org/fhir/StructureDefinition/Patient) "Patient" "Subject of procedure."
* performer 0..1 Reference(http://hl7.org/fhir/StructureDefinition/Practitioner or http://hl7.org/fhir/StructureDefinition/PractitionerRole) "Performer" "The people who performed the procedure."
* performed 1..1 dateTime "Effective time" "When the procedure was performed."
* position 1..1 Coding "The position of the individual at the time of measurement." "The position of the individual at the time of measurement."
* systolic 1..1 Quantity "The actual numeric result of systolic blood pressure." "The actual numeric result of systolic blood pressure."
* diastolic 1..1 Quantity "The actual numeric result of diastolic blood pressure." "The actual numeric result of diastolic blood pressure."
* note 0..1 string "Comments about the observation" "Comments about the observation"
```

## Convert from FHIR to FSH v2

Service URL:

```
http://localhost:3000/v2/fhir2fsh
```

"Content-type" header should be defined.

Format: application/fsh; [options]

Options:

- logLevel (string) ["silly", "debug", "verbose", "http", "info", "warn", "error", "silent"],

- indent (boolean),

- style (string) ["map", "string"]

Example:

`content-type: application/fhir+json; version=0.0.1`

### Example request

cURL request:

```
curl --request POST \
  --url http://localhost:3000/v2/fhir2fsh \
  --header 'content-type: application/fhir+json; version=0.0.1' \
  --header 'user-agent: vscode-restclient' \
  --data-binary '@./BloodPressure.json'
```

BloodPressure.json file content:

```
{
  "resourceType": "StructureDefinition",
  "id": "TermXBloodPressure",
  "url": "https://termx.org/Model/BloodPressure",
  "version": "1.0.0",
  "name": "TermXBloodPressure",
  "status": "draft",
  "publisher": "TermX",
  "fhirVersion": "5.0.0",
  "kind": "logical",
  "abstract": false,
  "type": "https://termx.org/Model/BloodPressure",
  "baseDefinition": "http://hl7.org/fhir/StructureDefinition/Element",
  "derivation": "specialization",
  "differential": {
    "element": [
      {
        "id": "BloodPressure",
        "path": "BloodPressure",
        "short": "TermXBloodPressure",
        "definition": "TermXBloodPressure"
      },
      {
        "id": "BloodPressure.patient",
        "path": "BloodPressure.patient",
        "short": "Patient",
        "definition": "Subject of procedure.",
        "min": 1,
        "max": "1",
        "type": [
          {
            "code": "Reference",
            "targetProfile": [
              "http://hl7.org/fhir/StructureDefinition/Patient"
            ]
          }
        ]
      },
      {
        "id": "BloodPressure.performer",
        "path": "BloodPressure.performer",
        "short": "Performer",
        "definition": "The people who performed the procedure.",
        "min": 0,
        "max": "1",
        "type": [
          {
            "code": "Reference",
            "targetProfile": [
              "http://hl7.org/fhir/StructureDefinition/Practitioner",
              "http://hl7.org/fhir/StructureDefinition/PractitionerRole"
            ]
          }
        ]
      },
      {
        "id": "BloodPressure.performed",
        "path": "BloodPressure.performed",
        "short": "Effective time",
        "definition": "When the procedure was performed.",
        "min": 1,
        "max": "1",
        "type": [
          {
            "code": "dateTime"
          }
        ]
      },
      {
        "id": "BloodPressure.position",
        "path": "BloodPressure.position",
        "short": "The position of the individual at the time of measurement.",
        "definition": "The position of the individual at the time of measurement.",
        "min": 1,
        "max": "1",
        "type": [
          {
            "code": "Coding"
          }
        ]
      },
      {
        "id": "BloodPressure.systolic",
        "path": "BloodPressure.systolic",
        "short": "The actual numeric result of systolic blood pressure.",
        "definition": "The actual numeric result of systolic blood pressure.",
        "min": 1,
        "max": "1",
        "type": [
          {
            "code": "Quantity"
          }
        ]
      },
      {
        "id": "BloodPressure.diastolic",
        "path": "BloodPressure.diastolic",
        "short": "The actual numeric result of diastolic blood pressure.",
        "definition": "The actual numeric result of diastolic blood pressure.",
        "min": 1,
        "max": "1",
        "type": [
          {
            "code": "Quantity"
          }
        ]
      },
      {
        "id": "BloodPressure.note",
        "path": "BloodPressure.note",
        "short": "Comments about the observation",
        "definition": "Comments about the observation",
        "min": 0,
        "max": "1",
        "type": [
          {
            "code": "string"
          }
        ]
      }
    ]
  }
}
```
