import BpmnModdle from "bpmn-moddle"

export interface BpmnNode {
  id: string
  name: string
  type: string
  incoming: string[]
  outgoing: string[]
}

export interface BpmnEdge {
  id: string
  source: string
  target: string
}

export interface BpmnGraph {
  nodes: BpmnNode[]
  edges: BpmnEdge[]
  startNodes: string[]
  endNodes: string[]
  approvalNodes: string[]
}

export class BpmnParser {

  private moddle = new BpmnModdle()

  async parse(xml: string): Promise<BpmnGraph> {

    const { rootElement }: any = await this.moddle.fromXML(xml)

    const process = rootElement.rootElements.find(
      (e: any) => e.$type === "bpmn:Process"
    )

    if (!process) {
      throw new Error("No BPMN process found")
    }

    const nodes: BpmnNode[] = []
    const edges: BpmnEdge[] = []

    for (const element of process.flowElements) {

      if (element.$type === "bpmn:SequenceFlow") {

        edges.push({
          id: element.id,
          source: element.sourceRef.id,
          target: element.targetRef.id
        })

      } else {

        nodes.push({
          id: element.id,
          name: element.name || "",
          type: element.$type,
          incoming: (element.incoming || []).map((i: any) => i.id),
          outgoing: (element.outgoing || []).map((o: any) => o.id)
        })

      }

    }

    const startNodes = nodes
      .filter(n => n.type === "bpmn:StartEvent")
      .map(n => n.id)

    const endNodes = nodes
      .filter(n => n.type === "bpmn:EndEvent")
      .map(n => n.id)

    const approvalNodes = nodes
      .filter(n =>
        n.type === "bpmn:UserTask" ||
        n.type === "bpmn:ServiceTask"
      )
      .map(n => n.id)

    return {
      nodes,
      edges,
      startNodes,
      endNodes,
      approvalNodes
    }
  }

  getNextNodes(graph: BpmnGraph, nodeId: string): string[] {

    return graph.edges
      .filter(e => e.source === nodeId)
      .map(e => e.target)

  }

  getPrevNodes(graph: BpmnGraph, nodeId: string): string[] {

    return graph.edges
      .filter(e => e.target === nodeId)
      .map(e => e.source)

  }

}

export const bpmnParser = new BpmnParser()
