import { Element } from 'diagram-js/lib/model/Types'
import { ModdleElement } from 'bpmn-moddle'
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil'
import { createModdleElement, getExtensionElementsList } from '@/utils/BpmnExtensionElementsUtil'
import modelerStore from '@/store/modeler'
import editorStore from '@/store/editor'
import { without } from 'min-dash'

export function getTaskHeaders(element: Element): ModdleElement[] {
  const businessObject = getRelevantBusinessObject(element)

  if (!businessObject) return []
  return getTaskHeadersList(businessObject) || []
}

export function addTaskHeader(element: Element, header) {
  try {
    const store = modelerStore()
    const editor = editorStore()

    const modeling = store.getModeling
    const prefix = editor.getProcessEngine

    const businessObject = getRelevantBusinessObject(element)

    let extensionElements = businessObject.get('extensionElements')
    if (!extensionElements) {
      extensionElements = createModdleElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject
      )
      modeling.updateModdleProperties(element, businessObject, { extensionElements })
    }

    let taskHeaders = getTaskHeadersElement(businessObject)
    if (!taskHeaders) {
      taskHeaders = createModdleElement(`${prefix}:TaskHeaders`, { values: [] }, extensionElements)
      const existingValues = extensionElements.get('values') || []
      modeling.updateModdleProperties(element, extensionElements, {
        values: [...existingValues, taskHeaders]
      })
    }

    const newHeader = createModdleElement(`${prefix}:Header`, header, taskHeaders)
    const existingHeaders = taskHeaders?.get('values') || []
    modeling.updateModdleProperties(element, taskHeaders, {
      values: [...existingHeaders, newHeader]
    })
  } catch (e) {
    console.log(e)
  }
}

export function removeTaskHeader(element: Element, header: ModdleElement) {
  const businessObject = getRelevantBusinessObject(element)
  const extensionElements = businessObject.get('extensionElements')
  const taskHeaders = getTaskHeadersElement(businessObject)
  if (!taskHeaders) return

  const store = modelerStore()
  const modeling = store.getModeling

  const values = without(taskHeaders.get('values'), header as any)
  modeling.updateModdleProperties(element, taskHeaders, { values })

  if (!values || !values.length) {
    modeling.updateModdleProperties(element, extensionElements, {
      values: without(extensionElements.get('values'), taskHeaders as any)
    })
  }
}

function getRelevantBusinessObject(element: Element) {
  const businessObject = getBusinessObject(element)
  if (!businessObject) return null
  if (is(element, 'bpmn:Participant')) {
    return businessObject.get('processRef')
  }
  return businessObject
}

function getTaskHeadersList(bo: ModdleElement): [] {
  const taskHeaders = getTaskHeadersElement(bo)
  if (!taskHeaders || !taskHeaders.$type || taskHeaders.$type !== 'zeebe:TaskHeaders') return []
  const vals = taskHeaders.get('values')
  return vals || []
}

function getTaskHeadersElement(bo: ModdleElement): ModdleElement | null {
  const list = getExtensionElementsList(bo)
  if (!list || list.length === 0) return null
  return list.find((item: any) => item.$type === 'zeebe:TaskHeaders') || null
}
