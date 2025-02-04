import { openmrsFetch, fhirBaseUrl } from '@openmrs/esm-framework';
import includes from 'lodash-es/includes';
import split from 'lodash-es/split';
import { FHIRImmunizationBundle, FHIRImmunizationResource, OpenmrsConcept } from './immunization-domain';

function getImmunizationsConceptSetByUuid(
  immunizationsConceptSetSearchText: string,
  abortController: AbortController,
): Promise<OpenmrsConcept> {
  return openmrsFetch(`/ws/rest/v1/concept/${immunizationsConceptSetSearchText}?v=full`, {
    signal: abortController.signal,
  }).then((response) => response.data);
}

function isConceptMapping(searchText: string) {
  return includes(searchText, ':');
}

function searchImmunizationsConceptSetByMapping(
  immunizationsConceptSetSearchText: string,
  abortController: AbortController,
): Promise<OpenmrsConcept> {
  const [source, code] = split(immunizationsConceptSetSearchText, ':');
  return openmrsFetch(`/ws/rest/v1/concept?source=${source}&code=${code}&v=full`, {
    signal: abortController.signal,
  }).then((response) => {
    return response.data.results[0];
  });
}

export async function getImmunizationsConceptSet(
  immunizationsConceptSetSearchText: string,
  abortController: AbortController,
): Promise<OpenmrsConcept> {
  const result = isConceptMapping(immunizationsConceptSetSearchText)
    ? await searchImmunizationsConceptSetByMapping(immunizationsConceptSetSearchText, abortController)
    : await getImmunizationsConceptSetByUuid(immunizationsConceptSetSearchText, abortController);
  if (!result) {
    throw new Error(`No concept found identified by '${immunizationsConceptSetSearchText}'`);
  }
  return result;
}

export function performPatientImmunizationsSearch(
  patientIdentifier: string,
  patientUuid: string,
  abortController: AbortController,
): Promise<FHIRImmunizationBundle> {
  return openmrsFetch(`${fhirBaseUrl}/Immunization?patient.identifier=${patientIdentifier}`, {
    signal: abortController.signal,
  }).then((response) => response.data);
}

export function savePatientImmunization(
  patientImmunization: FHIRImmunizationResource,
  patientUuid: string,
  immunizationObsUuid: string,
  abortController: AbortController,
) {
  let immunizationEndpoint = `${fhirBaseUrl}/Immunization`;
  if (immunizationObsUuid) {
    immunizationEndpoint = `${immunizationEndpoint}/${immunizationObsUuid}`;
  }
  return openmrsFetch(immunizationEndpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: patientImmunization,
    signal: abortController.signal,
  });
}
