const {INIT_EVENT, INIT_STATE} = require('kingly');
const assert = require('assert');
const {formatResult} = require('../helpers');
const {computeTransitionsAndStatesFromXmlString} = require('../conversion');

// cf. tests/graphs/test-yed-conversion.graphml
const yedString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns" xmlns:java="http://www.yworks.com/xml/yfiles-common/1.0/java" xmlns:sys="http://www.yworks.com/xml/yfiles-common/markup/primitives/2.0" xmlns:x="http://www.yworks.com/xml/yfiles-common/markup/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:y="http://www.yworks.com/xml/graphml" xmlns:yed="http://www.yworks.com/xml/yed/3" xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://www.yworks.com/xml/schema/graphml/1.1/ygraphml.xsd">
  <!--Created by yEd 3.19-->
  <key attr.name="Description" attr.type="string" for="graph" id="d0"/>
  <key for="port" id="d1" yfiles.type="portgraphics"/>
  <key for="port" id="d2" yfiles.type="portgeometry"/>
  <key for="port" id="d3" yfiles.type="portuserdata"/>
  <key attr.name="url" attr.type="string" for="node" id="d4"/>
  <key attr.name="description" attr.type="string" for="node" id="d5"/>
  <key for="node" id="d6" yfiles.type="nodegraphics"/>
  <key for="graphml" id="d7" yfiles.type="resources"/>
  <key attr.name="url" attr.type="string" for="edge" id="d8"/>
  <key attr.name="description" attr.type="string" for="edge" id="d9"/>
  <key for="edge" id="d10" yfiles.type="edgegraphics"/>
  <graph edgedefault="directed" id="G">
    <data key="d0" xml:space="preserve"/>
    <node id="n0">
      <data key="d6">
        <y:ShapeNode>
          <y:Geometry height="30.0" width="30.0" x="216.25" y="146.5"/>
          <y:Fill color="#FF6600" transparent="false"/>
          <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
          <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="21.994140625" x="4.0029296875" xml:space="preserve" y="5.6494140625">init</y:NodeLabel>
          <y:Shape type="ellipse"/>
        </y:ShapeNode>
      </data>
    </node>
    <node id="n1" yfiles.foldertype="group">
      <data key="d4" xml:space="preserve"/>
      <data key="d6">
        <y:ProxyAutoBoundsNode>
          <y:Realizers active="0">
            <y:GroupNode>
              <y:Geometry height="441.2529296875" width="533.5" x="0.0" y="272.0"/>
              <y:Fill color="#F5F5F5" transparent="false"/>
              <y:BorderStyle color="#000000" type="dashed" width="1.0"/>
              <y:NodeLabel alignment="right" autoSizePolicy="node_width" backgroundColor="#EBEBEB" borderDistance="0.0" fontFamily="Dialog" fontSize="15" fontStyle="plain" hasLineColor="false" height="22.37646484375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#000000" verticalTextPosition="bottom" visible="true" width="533.5" x="0.0" xml:space="preserve" y="0.0">Group 1</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
              <y:State closed="false" closedHeight="50.0" closedWidth="50.0" innerGraphDisplayEnabled="false"/>
              <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
              <y:BorderInsets bottom="0" bottomF="0.0" left="1" leftF="1.0" right="1" rightF="1.0" top="0" topF="0.0"/>
            </y:GroupNode>
            <y:GenericGroupNode configuration="PanelNode">
              <y:Geometry height="50.0" width="50.0" x="163.40238095238095" y="451.701171875"/>
              <y:Fill color="#68B0E3" transparent="false"/>
              <y:BorderStyle hasColor="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="right" autoSizePolicy="node_width" borderDistance="0.0" fontFamily="Dialog" fontSize="16" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="23.6015625" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#FFFFFF" verticalTextPosition="bottom" visible="true" width="62.6953125" x="-6.34765625" xml:space="preserve" y="0.0">Folder 1</y:NodeLabel>
              <y:StyleProperties>
                <y:Property class="java.awt.Color" name="headerBackground" value="#68b0e3"/>
              </y:StyleProperties>
              <y:State autoResize="true" closed="true" closedHeight="50.0" closedWidth="50.0"/>
              <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
              <y:BorderInsets bottom="0" bottomF="0.0" left="0" leftF="0.0" right="0" rightF="0.0" top="0" topF="0.0"/>
            </y:GenericGroupNode>
          </y:Realizers>
        </y:ProxyAutoBoundsNode>
      </data>
      <graph edgedefault="directed" id="n1:">
        <node id="n1::n0">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="61.0" width="64.0" x="16.0" y="456.7529296875"/>
              <y:Fill color="#FFCC00" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="53.9921875" x="5.00390625" xml:space="preserve" y="13.798828125">Showing
mini UI</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n1::n1">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="30.0" width="30.0" x="33.0" y="309.37646484375"/>
              <y:Fill color="#FF6600" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="21.994140625" x="4.0029296875" xml:space="preserve" y="5.6494140625">init</y:NodeLabel>
              <y:Shape type="ellipse"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n1::n2">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="30.0" width="30.0" x="140.0" y="637.7529296875"/>
              <y:Fill color="#FF6600" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="17.3359375" x="6.33203125" xml:space="preserve" y="5.6494140625">H*</y:NodeLabel>
              <y:Shape type="ellipse"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n1::n3" yfiles.foldertype="group">
          <data key="d4" xml:space="preserve"/>
          <data key="d6">
            <y:ProxyAutoBoundsNode>
              <y:Realizers active="0">
                <y:GroupNode>
                  <y:Geometry height="263.37646484375" width="287.5" x="230.0" y="434.87646484375"/>
                  <y:Fill color="#F5F5F5" transparent="false"/>
                  <y:BorderStyle color="#000000" type="dashed" width="1.0"/>
                  <y:NodeLabel alignment="right" autoSizePolicy="node_width" backgroundColor="#EBEBEB" borderDistance="0.0" fontFamily="Dialog" fontSize="15" fontStyle="plain" hasLineColor="false" height="22.37646484375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#000000" verticalTextPosition="bottom" visible="true" width="287.5" x="0.0" xml:space="preserve" y="0.0">big UI collapsed</y:NodeLabel>
                  <y:Shape type="roundrectangle"/>
                  <y:State closed="false" closedHeight="50.0" closedWidth="50.0" innerGraphDisplayEnabled="false"/>
                  <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
                  <y:BorderInsets bottom="0" bottomF="0.0" left="41" leftF="41.0" right="9" rightF="8.5" top="0" topF="0.0"/>
                </y:GroupNode>
                <y:GenericGroupNode configuration="PanelNode">
                  <y:Geometry height="50.0" width="50.0" x="230.0" y="434.87646484375"/>
                  <y:Fill color="#68B0E3" transparent="false"/>
                  <y:BorderStyle hasColor="false" type="line" width="1.0"/>
                  <y:NodeLabel alignment="right" autoSizePolicy="node_width" borderDistance="0.0" fontFamily="Dialog" fontSize="16" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="23.6015625" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#FFFFFF" verticalTextPosition="bottom" visible="true" width="117.84375" x="-33.921875" xml:space="preserve" y="0.0">big UI collapsed</y:NodeLabel>
                  <y:StyleProperties>
                    <y:Property class="java.awt.Color" name="headerBackground" value="#68b0e3"/>
                  </y:StyleProperties>
                  <y:State autoResize="true" closed="true" closedHeight="50.0" closedWidth="50.0"/>
                  <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
                  <y:BorderInsets bottom="0" bottomF="0.0" left="0" leftF="0.0" right="0" rightF="0.0" top="0" topF="0.0"/>
                </y:GenericGroupNode>
              </y:Realizers>
            </y:ProxyAutoBoundsNode>
          </data>
          <graph edgedefault="directed" id="n1::n3:">
            <node id="n1::n3::n0">
              <data key="d6">
                <y:ShapeNode>
                  <y:Geometry height="61.0" width="64.0" x="286.0" y="622.2529296875"/>
                  <y:Fill color="#FFCC00" transparent="false"/>
                  <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
                  <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="11.330078125" x="26.3349609375" xml:space="preserve" y="21.1494140625">If</y:NodeLabel>
                  <y:Shape type="roundrectangle"/>
                </y:ShapeNode>
              </data>
            </node>
            <node id="n1::n3::n1">
              <data key="d6">
                <y:ShapeNode>
                  <y:Geometry height="30.0" width="30.0" x="303.0" y="472.2529296875"/>
                  <y:Fill color="#FF6600" transparent="false"/>
                  <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
                  <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="21.994140625" x="4.0029296875" xml:space="preserve" y="5.6494140625">init</y:NodeLabel>
                  <y:Shape type="ellipse"/>
                </y:ShapeNode>
              </data>
            </node>
            <node id="n1::n3::n2">
              <data key="d6">
                <y:ShapeNode>
                  <y:Geometry height="61.0" width="64.0" x="430.0" y="622.2529296875"/>
                  <y:Fill color="#FFCC00" transparent="false"/>
                  <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
                  <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="56.01953125" x="3.990234375" xml:space="preserve" y="21.1494140625">then else</y:NodeLabel>
                  <y:Shape type="roundrectangle"/>
                </y:ShapeNode>
              </data>
            </node>
          </graph>
        </node>
        <node id="n1::n4">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="61.0" width="64.0" x="16.0" y="622.2529296875"/>
              <y:Fill color="#FFCC00" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="46.673828125" x="8.6630859375" xml:space="preserve" y="21.1494140625">dummy</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
            </y:ShapeNode>
          </data>
        </node>
      </graph>
    </node>
    <node id="n2">
      <data key="d6">
        <y:ShapeNode>
          <y:Geometry height="60.0" width="60.0" x="140.0" y="806.6552734375"/>
          <y:Fill color="#FFCC00" transparent="false"/>
          <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
          <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="custom" textColor="#000000" verticalTextPosition="bottom" visible="true" width="50.04296875" x="4.978515625" xml:space="preserve" y="20.6494140625">updating<y:LabelModel><y:SmartNodeLabelModel distance="4.0"/></y:LabelModel><y:ModelParameter><y:SmartNodeLabelModelParameter labelRatioX="0.0" labelRatioY="0.0" nodeRatioX="0.0" nodeRatioY="0.0" offsetX="0.0" offsetY="0.0" upX="0.0" upY="-1.0"/></y:ModelParameter></y:NodeLabel>
          <y:Shape type="diamond"/>
        </y:ShapeNode>
      </data>
    </node>
    <node id="n3" yfiles.foldertype="group">
      <data key="d4" xml:space="preserve"/>
      <data key="d6">
        <y:ProxyAutoBoundsNode>
          <y:Realizers active="0">
            <y:GroupNode>
              <y:Geometry height="554.62939453125" width="177.0" x="593.5" y="-37.37646484375"/>
              <y:Fill color="#F5F5F5" transparent="false"/>
              <y:BorderStyle color="#000000" type="dashed" width="1.0"/>
              <y:NodeLabel alignment="right" autoSizePolicy="node_width" backgroundColor="#EBEBEB" borderDistance="0.0" fontFamily="Dialog" fontSize="15" fontStyle="plain" hasLineColor="false" height="22.37646484375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#000000" verticalTextPosition="bottom" visible="true" width="177.0" x="0.0" xml:space="preserve" y="0.0">Group 3</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
              <y:State closed="false" closedHeight="50.0" closedWidth="50.0" innerGraphDisplayEnabled="false"/>
              <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
              <y:BorderInsets bottom="0" bottomF="0.0" left="82" leftF="82.0" right="1" rightF="1.0" top="0" topF="0.0"/>
            </y:GroupNode>
            <y:GenericGroupNode configuration="PanelNode">
              <y:Geometry height="50.0" width="50.0" x="-25.0" y="-25.0"/>
              <y:Fill color="#68B0E3" transparent="false"/>
              <y:BorderStyle hasColor="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="right" autoSizePolicy="node_width" borderDistance="0.0" fontFamily="Dialog" fontSize="16" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="23.6015625" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="t" textColor="#FFFFFF" verticalTextPosition="bottom" visible="true" width="61.8125" x="-5.90625" xml:space="preserve" y="0.0">Group 3</y:NodeLabel>
              <y:StyleProperties>
                <y:Property class="java.awt.Color" name="headerBackground" value="#68b0e3"/>
              </y:StyleProperties>
              <y:State autoResize="true" closed="true" closedHeight="50.0" closedWidth="50.0"/>
              <y:Insets bottom="15" bottomF="15.0" left="15" leftF="15.0" right="15" rightF="15.0" top="15" topF="15.0"/>
              <y:BorderInsets bottom="0" bottomF="0.0" left="0" leftF="0.0" right="0" rightF="0.0" top="0" topF="0.0"/>
            </y:GenericGroupNode>
          </y:Realizers>
        </y:ProxyAutoBoundsNode>
      </data>
      <graph edgedefault="directed" id="n3:">
        <node id="n3::n0">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="61.0" width="64.0" x="690.5" y="131.0"/>
              <y:Fill color="#FFCC00" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="50.01953125" x="6.990234375" xml:space="preserve" y="13.798828125">ran kan 
kan</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n3::n1">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="30.0" width="30.0" x="707.5" y="0.0"/>
              <y:Fill color="#FF6600" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="21.994140625" x="4.0029296875" xml:space="preserve" y="5.6494140625">init</y:NodeLabel>
              <y:Shape type="ellipse"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n3::n2">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="61.0" width="64.0" x="690.5" y="293.87646484375"/>
              <y:Fill color="#FFCC00" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="46.01171875" x="8.994140625" xml:space="preserve" y="13.798828125">pa dam
dam</y:NodeLabel>
              <y:Shape type="roundrectangle"/>
            </y:ShapeNode>
          </data>
        </node>
        <node id="n3::n3">
          <data key="d6">
            <y:ShapeNode>
              <y:Geometry height="30.0" width="30.0" x="707.5" y="472.2529296875"/>
              <y:Fill color="#FF6600" transparent="false"/>
              <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
              <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="bold" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="internal" modelPosition="c" textColor="#000000" verticalTextPosition="bottom" visible="true" width="12.666015625" x="8.6669921875" xml:space="preserve" y="5.6494140625">H</y:NodeLabel>
              <y:Shape type="ellipse"/>
            </y:ShapeNode>
          </data>
        </node>
      </graph>
    </node>
    <edge id="e0" source="n0" target="n1">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="15.0" tx="-35.5" ty="-220.62646484375"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="right" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="52.0234375" x="-54.0234375" xml:space="preserve" y="10.125">
/ activate<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" placement="anywhere" side="right" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="e1" source="n1" target="n2">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-81.75" sy="220.62646484375" tx="15.0" ty="-14.96875"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="right" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="107.39453125" x="-109.39453125" xml:space="preserve" y="10.125">trace sent
/ update trace store<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" placement="anywhere" side="right" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n3::e0" source="n3::n1" target="n3::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="15.0" tx="0.0" ty="-30.5"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" hasText="false" height="4.0" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="4.0" x="-6.0" y="10.125">
            <y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/>
          </y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n3::e1" source="n3::n0" target="n3::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-32.0" sy="-15.25" tx="-16.0" ty="-30.5">
            <y:Point x="650.0" y="146.25"/>
            <y:Point x="650.0" y="90.5"/>
            <y:Point x="706.5" y="90.5"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="60.009765625" x="-54.77783203125" xml:space="preserve" y="-20.701171875">stay [isOk]<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n3::e2" source="n3::n0" target="n3::n2">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="30.5" tx="0.0" ty="-30.5"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="left" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="33.40234375" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="285.232421875" x="-65.921875" xml:space="preserve" y="2.7744140625">| stay [not(isOk, shown)] / deactivate, restore session
| trace sent<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n3::e3" source="n3::n2" target="n3::n3">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="30.5" tx="0.0" ty="-15.0"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" hasText="false" height="4.0" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="4.0" x="-6.0" y="10.125">
            <y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/>
          </y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="e2" source="n3::n0" target="n1::n3::n2">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-32.0" sy="15.25" tx="0.0" ty="-30.5">
            <y:Point x="609.5" y="176.75"/>
            <y:Point x="609.5" y="232.0"/>
            <y:Point x="462.0" y="232.0"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="7.333984375" x="-17.41943359375" xml:space="preserve" y="2.0">/<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="e3" source="n3::n2" target="n1::n3">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-32.0" sy="0.0" tx="128.25" ty="-131.688232421875">
            <y:Point x="609.5" y="324.37646484375"/>
            <y:Point x="609.5" y="394.87646484375"/>
            <y:Point x="502.0" y="394.87646484375"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="10.66796875" x="-20.75341796875" xml:space="preserve" y="-20.701171875">[]<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="e4" source="n2" target="n1::n2">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-15.0" sy="-14.96875" tx="0.0" ty="15.0"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" hasText="false" height="4.0" horizontalTextPosition="center" iconTextGap="4" modelName="custom" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="4.0" x="28.0" y="-89.94482421875">
            <y:LabelModel>
              <y:SmartEdgeLabelModel autoRotationEnabled="false" defaultAngle="0.0" defaultDistance="10.0"/>
            </y:LabelModel>
            <y:ModelParameter>
              <y:SmartEdgeLabelModelParameter angle="0.0" distance="30.0" distanceToCenter="true" position="right" ratio="0.5" segment="0"/>
            </y:ModelParameter>
            <y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/>
          </y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::e0" source="n1::n0" target="n1::n3::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="21.333333333333332" sy="30.5" tx="-32.0" ty="0.0">
            <y:Point x="69.33333333333333" y="582.2529296875"/>
            <y:Point x="246.0" y="582.2529296875"/>
            <y:Point x="246.0" y="652.7529296875"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="right" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="134.740234375" x="-136.74023691813153" xml:space="preserve" y="10.125">[shown] / expand clicked<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" placement="anywhere" side="right" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::e1" source="n1::n0" target="n1::n4">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="30.5" tx="0.0" ty="-30.5"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="custom" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="17.3359375" x="-19.3359375" xml:space="preserve" y="42.8994140625">[] /<y:LabelModel><y:SmartEdgeLabelModel autoRotationEnabled="false" defaultAngle="0.0" defaultDistance="10.0"/></y:LabelModel><y:ModelParameter><y:SmartEdgeLabelModelParameter angle="6.283185307179586" distance="2.0" distanceToCenter="false" position="right" ratio="0.5" segment="-1"/></y:ModelParameter><y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::e2" source="n1::n1" target="n1::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="15.0" tx="0.0" ty="-30.5"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="right" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="92.037109375" x="-94.037109375" xml:space="preserve" y="10.125">/ restore session<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" placement="anywhere" side="right" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::e3" source="n1::n3::n0" target="n1::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="-21.333333333333332" sy="-30.5" tx="32.0" ty="0.0">
            <y:Point x="296.6666666666667" y="542.2529296875"/>
            <y:Point x="215.0" y="542.2529296875"/>
            <y:Point x="215.0" y="487.2529296875"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="right" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="91.3515625" x="2.0000101725260038" xml:space="preserve" y="-28.787109375">minimize clicked<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" placement="anywhere" side="right" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::n3::e0" source="n1::n3::n1" target="n1::n3::n0">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="0.0" sy="15.0" tx="0.0" ty="-30.5"/>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="66.70703125" x="-68.70703125" xml:space="preserve" y="10.125">[only guard]<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
    <edge id="n1::n3::e1" source="n1::n3::n1" target="n1::n3::n2">
      <data key="d10">
        <y:PolyLineEdge>
          <y:Path sx="15.0" sy="0.0" tx="-32.0" ty="0.0">
            <y:Point x="390.0" y="487.2529296875"/>
            <y:Point x="390.0" y="652.7529296875"/>
          </y:Path>
          <y:LineStyle color="#000000" type="line" width="1.0"/>
          <y:Arrows source="none" target="standard"/>
          <y:EdgeLabel alignment="center" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.701171875" horizontalTextPosition="center" iconTextGap="4" modelName="free" modelPosition="anywhere" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="110.740234375" x="59.0" xml:space="preserve" y="73.3994140625">[another only guard]<y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
          <y:BendStyle smoothed="false"/>
        </y:PolyLineEdge>
      </data>
    </edge>
  </graph>
  <data key="d7">
    <y:Resources/>
  </data>
</graphml>

`

describe('Conversion yed to kingly', function () {
  const {getKinglyTransitions, stateYed2KinglyMap, states, events} = computeTransitionsAndStatesFromXmlString(yedString);

  describe('stateYed2KinglyMap', function () {
    it('Internal labels given to nodes as per XML file are correctly mapped to user-given names of nodes/control states', function () {
      assert.deepEqual(stateYed2KinglyMap, {
        "n0": "init",
        "n1::n0": `Showing\nmini UI`,
        "n1::n1": "init",
        "n1::n2": "H*",
        "n1::n3": "big UI collapsed",
        "n1::n3::n0": "If",
        "n1::n3::n1": "init",
        "n1::n3::n2": "then else",
        "n1::n4": "dummy",
        "n1": "Group 1",
        "n2": "updating",
        "n3::n0": "ran kan \nkan",
        "n3::n1": "init",
        "n3::n2": "pa dam\ndam",
        "n3::n3": "H",
        "n3": "Group 3",
      });
    });
  });

  describe('states', function () {
    it(`The state hierarchy of the yed graph is correctly converted to a Kingly states configuration property`, function () {
      assert.deepEqual(states, {
        "n2ღupdating": "",
        "n1ღGroup 1": {
          "n1::n0ღShowing\nmini UI": "",
          "n1::n3ღbig UI collapsed": {
            "n1::n3::n0ღIf": "",
            "n1::n3::n2ღthen else": "",
          },
          "n1::n4ღdummy": "",
        },
        "n3ღGroup 3": {
          "n3::n0ღran kan \nkan": "",
          "n3::n2ღpa dam\ndam": "",
        },
      });
    });
  });

  describe('events', function () {
    it(`The events used in the yed graph are correctly converted to a Kingly events configuration property`, function () {
      assert.deepEqual(events, [
          "trace sent",
          "stay",
          "minimize clicked"
        ],
      );
    });
  });

  // DEPRECATED
  // With the addition of comma-separated composites guards and actions,
  // there is no longer a convenient way to get the transitions in a
  // way that is easy to test against expected values.
  // Guards and actions use higher-order functions which always have
  // the same name, so it is not possible to discriminate what is inside.
  // We keep the test here for the record of the decision
  // describe.skip('getKinglyTransitions', function () {
  //   it(`The transitions for the yed graph are correctly reflected in a Kingly transitions configuration property`, function () {
  //     const actionFactories = {
  //       activate: "-activate",
  //       "update trace store": "-update trace store",
  //       "deactivate": "-deactivate",
  //       "expand clicked": "-expand clicked",
  //       "restore session": "-restore session",
  //     };
  //     const guards = {
  //       isOk: "-isOk",
  //       "not(isOk)": "-not(isOk)",
  //       "shown": "-shown",
  //       "only guard": "-only guard",
  //       "another only guard": "-another only guard"
  //
  //     };
  //     const formattedTransitions = getKinglyTransitions({actionFactories, guards}).transitions
  //       .map(formatResult);
  //
  //     assert.deepEqual(formattedTransitions, [
  //         // NOTE: top-level initial transition (simulates initialControlState)
  //         // so no event is allowed by the user on such pseudo-states
  //         {
  //           "action": "-activate",
  //           "event": INIT_EVENT,
  //           "from": INIT_STATE,
  //           "to": "n1ღGroup 1",
  //         },
  //         {
  //           "action": "-update trace store",
  //           "event": "trace sent",
  //           "from": "n1ღGroup 1",
  //           "to": "n2ღupdating",
  //         },
  //         {
  //           "action": "ACTION_IDENTITY",
  //           "event": INIT_EVENT,
  //           "from": "n3ღGroup 3",
  //           "to": "n3::n0ღran kan \nkan",
  //         },
  //         {
  //           "event": "stay",
  //           "from": "n3::n0ღran kan \nkan",
  //           "guards": [
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "-isOk",
  //               "to": "n3::n0ღran kan \nkan",
  //             },
  //             {
  //               "action": "-deactivate",
  //               "predicate": "-not(isOk)",
  //               "to": "n3::n2ღpa dam\ndam",
  //             }
  //           ]
  //         },
  //         {
  //           "event": "",
  //           "from": "n3::n2ღpa dam\ndam",
  //           "guards": [
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "T",
  //               "to": {
  //                 "shallow": "n3ღGroup 3"
  //               }
  //             },
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "T",
  //               "to": "n1::n3ღbig UI collapsed"
  //             }
  //           ]
  //         },
  //         {
  //           "action": "ACTION_IDENTITY",
  //           "event": "",
  //           "from": "n3::n0ღran kan \nkan",
  //           "to": "n1::n3::n2ღthen else"
  //         },
  //         {
  //           "action": "ACTION_IDENTITY",
  //           "event": "",
  //           "from": "n2ღupdating",
  //           "to": {
  //             "deep": "n1ღGroup 1"
  //           }
  //         },
  //         {
  //           "event": "",
  //           "from": "n1::n0ღShowing\nmini UI",
  //           "guards": [
  //             {
  //               "action": "-expand clicked",
  //               "predicate": "-shown",
  //               "to": "n1::n3::n0ღIf",
  //             },
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "T",
  //               "to": "n1::n4ღdummy",
  //             }
  //           ]
  //         },
  //         {
  //           "action": "-restore session",
  //           "event": INIT_EVENT,
  //           "from": "n1ღGroup 1",
  //           "to": "n1::n0ღShowing\nmini UI",
  //         },
  //         {
  //           "action": "ACTION_IDENTITY",
  //           "event": "minimize clicked",
  //           "from": "n1::n3::n0ღIf",
  //           "to": "n1::n0ღShowing\nmini UI"
  //         },
  //         {
  //           "event": INIT_EVENT,
  //           "from": "n1::n3ღbig UI collapsed",
  //           "guards": [
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "-only guard",
  //               "to": "n1::n3::n0ღIf"
  //             },
  //             {
  //               "action": "ACTION_IDENTITY",
  //               "predicate": "-another only guard",
  //               "to": "n1::n3::n2ღthen else"
  //             }
  //           ]
  //         }
  //       ]
  //     );
  //   });
  // });

});
