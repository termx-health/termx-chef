# fsh-chef



### Convert from FSH to FHIR

Service URL:

```url
http://localhost:3000/v2/fsh2fhir
```

Content-type header should be defined.

Format: application/fsh; [options]

Options:

- canonical (string),

- version (string),

- fhirVersion (string),

- logLevel ["silly", "debug", "verbose", "http", "info", "warn", "error", "silent"];

- snapshot [true/false];

Example:

`content-type: application/fsh; version=0.0.1`



### Example request:

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




