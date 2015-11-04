//"use strict";
//===============================================================//
// define the ngEcho module

angular.module('ngEcho', [])

/** define the directive
 *  @name echoDirective
 *  @description echo graph as directive
 *  @scope scope
 *  @api api
 **/

    .directive('echoDirective', ['$compile', 'EchoFactory', function ($compile, EchoFactory) {
        // return the directive definition object
        return {
            restrict: "EA",
            controllerAs: "echoCtrl",
            priority: 100,
            scope: {
                echoDirective: "="
            },
            bindToController: true,
            controller: function ($scope, $element) {
                console.log('In echoDirective controller');
                // this makes sure our parent app gets its echoInstance back
                this.echoDirective.echoInstance = new EchoFactory($element, this.echoDirective);
                this.test = true;
            },
            // define the "link" function
            link: function (scope, element) { //, attr, ctrl) {
                console.log('In echoDirective link');
                // Add CSS class to set a CSS "namespace"
                element.addClass("echo-graph");
                //element.prop("flex", true);
                element.attr("layout", "column");
            }
        };
    }])

//---------------------------------------------------------------//
// define the echo factory
    .factory('EchoFactory', function () {
        // constructor
        function EchoFactory(element, options) {
            this.element = element;
            this.options = options;
            this.formValues = options.form.defaults;

            this.initNodes(options.configuration);
            this.initNodeLinks(options.generalConfig.defaultPaths);

            // set work area width & height
            var minWidth = 600;
            var minHeight = 400;
            this.width = minWidth;
            this.height = minHeight;

            this.margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            };
            this.netWidth = this.width - this.margin.left - this.margin.right;
            this.netHeight = this.height - this.margin.top - this.margin.bottom;
            this.checkboxWidth = 12;
            this.portMargin = 5; // margin between an icon and its connection port

            this.lvlANodeW = 30;
            this.lvlANodeH = 50;
            this.lvlBNodeW = 30;
            this.lvlBNodeH = 50;
            this.lvlCNodeW = 30;
            this.lvlCNodeH = 30;

            this.innerSvgWidth = 600;
            this.innerSvgHeight = 400;

            this.svg = d3.select(element[0])
                .append("div")
                //.property("flex", true)
                .attr("class", "echoSvgWrapper")
                .append("svg")
                .attr("viewBox", "0 0 " + this.innerSvgWidth + " " + this.innerSvgHeight)
                .attr("preserveAspectRatio", "none")
                .append("g")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            this.draw(this.layout());

            // save initial states for links and checkboxes, so that they can be restored
            // (doing this after calling layout(), so that the objects contain screen coordinates)
            this.initialLinks = angular.copy(this.nodeLinks);
            this.initialCheckboxes = angular.copy(this.checkboxes);
        }


        //---------------------------------------------------
        // layout - compute screen locations
        //---------------------------------------------------
        EchoFactory.prototype.layout = function () {
            var data = {
                nodeLabels: [],
                //lvlACheckboxes: [],
                //lvlBCheckboxes: [],
                //lvlCCheckboxes: [],
                lvlAPorts: [],
                lvlBLeftPorts: [],
                lvlBRightPorts: [],
                lvlCTopPorts: [],
                lvlCBottomPorts: []
            };

            var i, j, _x, _y, _x1, _x2, _y1, _y2, node, _nodeId, xCheckbox, yCheckbox,
                portScale, link, aPort, bPort, cPort, key;

            // ----------------------------
            // compute horizontal locations

            var overallHorizontalScale = d3.scale.ordinal()
                .domain(getNumberArray(2 + this.noOfLvlCNodes))
                .rangePoints([0, this.netWidth - 1], 0.5);
            //.rangePoints([0, this.innerSvgWidth - 1], 0.5);

            // -------------------------------
            // compute level A nodes, labels, ports, checkboxes

            var lvlANodesScale = d3.scale.ordinal()
                .domain(getNumberArray(this.noOfLvlANodes))
                .rangePoints([0, this.netHeight - 1], 1);

            //    for (i = 0; i < this.noOfLvlANodes; i++) {
            for (_nodeId in this.nodes.lvlA) {
                if (this.nodes.lvlA.hasOwnProperty(_nodeId)) {
                    node = this.nodes.lvlA[_nodeId];
                    i = node.index;
                    _x = overallHorizontalScale(0);
                    _y = lvlANodesScale(i);
                    xCheckbox = _x + this.lvlANodeW / 2 + this.portMargin;
                    yCheckbox = _y - this.checkboxWidth / 2;

                    //data.lvlANodes.push({
                    node.x = _x;
                    node.y = _y;

                    data.nodeLabels.push({
                        text: node.label,
                        x: _x,
                        y: _y - this.lvlANodeH / 2 - this.portMargin,
                        align: 'middle'
                    });
                    temp = this.checkboxes.lvlA[_nodeId];
                    temp.x = xCheckbox;
                    temp.y = yCheckbox;

                    portScale = d3.scale.ordinal()
                        .domain(getNumberArray(this.noOfLvlBNodes))
                        .rangePoints([0, this.checkboxWidth - 1], 1);

                    for (j = 0; j < this.noOfLvlBNodes; j++) {
                        data.lvlAPorts.push({
                            x: xCheckbox + this.checkboxWidth + this.portMargin,
                            y: yCheckbox + portScale(j)
                        });
                    }

                    /*
                     portScale = d3.scale.ordinal()
                     .domain(getNumberArray(this.noOfLvlBNodes))
                     .rangePoints([0, this.lvlANodeH-1], 1);

                     for (j = 0; j < this.noOfLvlBNodes; j++) {
                     data.lvlAPorts.push({x: _x + this.lvlANodeW /2 + 2*this.portMargin + this.checkboxWidth, y: _y - this.lvlANodeH/2 + portScale(j)});
                     }
                     */
                }
            }

            // -------------------------------
            // compute level B nodes, ports, checkboxes

            var lvlBNodesScale = d3.scale.ordinal()
                .domain(getNumberArray(this.noOfLvlBNodes))
                .rangePoints([0, this.netHeight - 1], 1);

            //    for (i = 0; i < this.noOfLvlBNodes; i++) {
            for (_nodeId in this.nodes.lvlB) {
                if (this.nodes.lvlB.hasOwnProperty(_nodeId)) {
                    node = this.nodes.lvlB[_nodeId];
                    i = node.index;
                    _x = overallHorizontalScale(1);
                    _y = lvlBNodesScale(i);
                    xCheckbox = _x - this.lvlBNodeW / 2 - this.portMargin - this.checkboxWidth;
                    yCheckbox = _y - this.checkboxWidth / 2;

                    //      data.lvlBNodes.push({
                    node.x = _x;
                    node.y = _y;

                    data.nodeLabels.push({
                        text: node.label,
                        x: _x,
                        y: _y - this.lvlBNodeH / 2 - this.portMargin,
                        align: 'middle'
                    });
                    temp = this.checkboxes.lvlB[_nodeId];
                    temp.x = xCheckbox;
                    temp.y = yCheckbox;

                    portScale = d3.scale.ordinal()
                        .domain(getNumberArray(this.noOfLvlANodes))
                        .rangePoints([0, this.checkboxWidth - 1], 0.5);

                    for (j = 0; j < this.noOfLvlANodes; j++) {
                        data.lvlBLeftPorts.push({
                            x: xCheckbox - this.portMargin,
                            y: yCheckbox + portScale(j)
                        });
                    }

                    portScale = d3.scale.ordinal()
                        .domain(getNumberArray(this.noOfLvlCNodes * 2))
                        .rangePoints([0, this.lvlBNodeH - 1], 1);

                    for (j = 0; j < this.noOfLvlCNodes * 2; j++) {
                        data.lvlBRightPorts.push({
                            x: _x + this.lvlBNodeW / 2 + this.portMargin,
                            y: i === 0 ?
                            _y + this.lvlBNodeH / 2 - portScale(j) : _y - this.lvlBNodeH / 2 + portScale(j)
                        });
                    }
                }
            }

            // -------------------------------
            // compute level C nodes, ports, checkboxes

//    for (i = 2; i <= this.noOfLvlCNodes + 1; i++) {
            for (_nodeId in this.nodes.lvlC) {
                node = this.nodes.lvlC[_nodeId];
                i = node.index;
                _x = overallHorizontalScale(i + 2);
                _y = this.netHeight / 2;
//      data.lvlCNodes.push({
                node.x = _x;
                node.y = _y;

                data.nodeLabels.push({
                    text: node.label,
                    x: _x + this.lvlCNodeW / 2 + this.portMargin,
                    y: _y,
                    align: 'start'
                });

                portScale = d3.scale.ordinal()
                    .domain([0, 1])
                    .rangePoints([0, this.lvlCNodeW - 1], 1);

                for (j = 0; j < 2; j++) {
                    _x1 = _x2 = _x - this.lvlCNodeW / 2 + portScale(j);
                    _y1 = _y - this.lvlCNodeH / 2 - 2 * this.portMargin - this.checkboxWidth;
                    _y2 = _y + this.lvlCNodeH / 2 + 2 * this.portMargin + this.checkboxWidth;
                    data.lvlCTopPorts.push({
                        x: _x1,
                        y: _y1
                    });

                    key = "" + _nodeId + 0 + j;
                    temp = this.checkboxes.lvlC[key];
                    temp.x = _x1 - this.checkboxWidth / 2;
                    temp.y = _y1 + this.portMargin;

                    data.lvlCBottomPorts.push({
                        x: _x2,
                        y: _y2
                    });

                    key = "" + _nodeId + 1 + j;
                    temp = this.checkboxes.lvlC[key];
                    temp.x = _x2 - this.checkboxWidth / 2;
                    temp.y = _y2 - this.portMargin - this.checkboxWidth;
                }
            }

            // -------------------------------
            // compute links

            for (i = 0; i < this.nodeLinks.length; i++) {
                link = this.nodeLinks[i];

                if (!(link.segment[1] instanceof Array)) { // lvlA-lvlB link, e.g [3,2]
                    link.aNodeId = link.segment[0];
                    link.bNodeId = link.segment[1]
                    //link.aNodeId = link[0];
                    //link.bNodeId = link[1]
                    link.aNode = this.nodes.lvlA[link.aNodeId].index;
                    link.bNode = this.nodes.lvlB[link.bNodeId].index;
                    aPort = link.aNode * 2 + link.bNode;
                    bPort = link.bNode * this.noOfLvlANodes + link.aNode;
                    link.x1 = data.lvlAPorts[aPort].x;
                    link.y1 = data.lvlAPorts[aPort].y;
                    link.x2 = data.lvlBLeftPorts[bPort].x;
                    link.y2 = data.lvlBLeftPorts[bPort].y;
                    link.path = 'M ' + link.x1 + ' ' + link.y1 + ' L ' + link.x2 + ' ' + link.y2;
                    //if (link.active) {
                    //    // mark the related checboxes
                    //    this.checkboxes.lvlA[link.aNodeId].checked = true;
                    //    this.checkboxes.lvlB[link.bNodeId].checked = true;
                    //}
                } else { // lvlB-lvlC links, e.g. [6,[1,1]]
                    link.bNodeId = link.segment[0];
                    link.cNodeId = link.segment[1][0];
                    link.cConn = link.segment[1][1]; // lvl C "port" (0 or 1)
                    //link.bNodeId = link[0];
                    //link.cNodeId = link[1][0];
                    //link.cConn = link[1][1]; // lvl C "port" (0 or 1)
                    link.bNode = this.nodes.lvlB[link.bNodeId].index; // lvl B node (0 or 1)
                    link.cNode = this.nodes.lvlC[link.cNodeId].index;
                    cPort = link.cNode * 2 + link.cConn;
                    if (link.bNode === 0) { // top links
                        bPort = cPort;
                        _x1 = data.lvlBRightPorts[bPort].x;
                        _y1 = data.lvlBRightPorts[bPort].y;
                        _x2 = data.lvlCTopPorts[cPort].x;
                        _y2 = data.lvlCTopPorts[cPort].y;
                    } else { // bottom links
                        bPort = cPort + this.noOfLvlCNodes * 2;
                        _x1 = data.lvlBRightPorts[bPort].x;
                        _y1 = data.lvlBRightPorts[bPort].y;
                        _x2 = data.lvlCBottomPorts[cPort].x;
                        _y2 = data.lvlCBottomPorts[cPort].y;
                    }
                    link.x1 = _x1;
                    link.y1 = _y1;
                    link.x2 = _x2;
                    link.y2 = _y2;
                    link.path = 'M ' + _x1 + ' ' + _y1 + ' H ' + _x2 + ' V ' + _y2;
                    //if (link.active) {
                    //    // mark the related checboxes
                    //    key = "" + link.cNodeId + link.bNode + link.cConn;
                    //    this.checkboxes.lvlC[key].checked = true;
                    //}
                }
            }

            return data;

            //---------------------------------------------------
            // getNumberArray(n) returns the array [0, 1, ..., n-1]
            // This is useful for ordinal scales

            function getNumberArray(length) {
                var a = new Array(length);
                for (var i = 0; i < a.length; i++) {
                    a[i] = i;
                }
                return a;
            }

            //---------------------------------------------------
        }; // end of Layout()


        //---------------------------------------------------
        // draw - Draw the graph
        //---------------------------------------------------
        EchoFactory.prototype.draw = function (dataset) {
            var that = this;

            var lvlANodeIcons = drawNodeIcons("lvlANode", d3.values(this.nodes.lvlA),
                this.lvlANodeW, this.lvlANodeH, this.options.generalConfig.lvlAImage);

            var lvlBNodeIcons = drawNodeIcons("lvlBNode", d3.values(this.nodes.lvlB),
                this.lvlBNodeW, this.lvlBNodeH, this.options.generalConfig.lvlBImage);

            var lvlCNodeIcons = drawNodeIcons("lvlCNode", d3.values(this.nodes.lvlC),
                this.lvlCNodeW, this.lvlCNodeH, this.options.generalConfig.lvlCImage);

            var nodeLabels = drawnodeLabels(dataset.nodeLabels);

            var checkboxes = this.drawCheckboxes();

            var portIcons = drawNodePorts(dataset.lvlAPorts.concat(
                dataset.lvlBLeftPorts, dataset.lvlBRightPorts, dataset.lvlCTopPorts, dataset.lvlCBottomPorts));

            this.drawLinks();

            //---------------------------------------------------
            function drawNodeIcons(className, _dataset, iconW, iconH, defaultImageUrl) {
                return that.svg.selectAll("ellipse." + className)
                    .data(_dataset)
                    .enter()
                    .append("image")
                    .attr("xlink:href", function (d) {
                        return !!d.imgUrl ? d.imgUrl : defaultImageUrl;
                    })
                    .attr("width", iconW)
                    .attr("height", iconH)
                    .attr("x", function (d) {
                        return d.x - iconW / 2;
                    })
                    .attr("y", function (d) {
                        return d.y - iconH / 2;
                    });
                //.append("ellipse")
                //.attr("class", className)
                //.attr("cx", function (d) {
                //    return d.x;
                //})
                //.attr("cy", function (d) {
                //    return d.y;
                //})
                //.attr("rx", iconW / 2)
                //.attr("ry", iconH / 2);
            }

            //---------------------------------------------------
            function drawnodeLabels(_dataset) {
                return that.svg.selectAll("text.nodeLabel")
                    .data(_dataset)
                    .enter()
                    .append("text")
                    .attr("class", "nodeLabel")
                    .text(function (d) {
                        return d.text;
                    })
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    })
                    .attr("text-anchor", function (d) {
                        return d.align;
                    })
            }

            //---------------------------------------------------
            function drawNodePorts(_dataset) {
                return that.svg.selectAll("circle.port")
                    .data(_dataset)
                    .enter()
                    .append("circle")
                    .attr("class", "port")
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            }
        };

        //---------------------------------------------------
        // drawLinks
        //---------------------------------------------------
        EchoFactory.prototype.drawLinks = function () {
            var that = this;
            var paths = this.svg.selectAll("path.link")
                .data(this.nodeLinks)
            paths.enter()
                .append("path")
                .attr("d", function (d) {
                    return d.path;
                })
                .append("title"); // attach a title element for a tooltip
            // set CSS classes for the path
            var classes;
            paths.attr("class", function (d) {
                classes = "link";
                // show only active lines
                classes += d.active ? "" : " hide_me";
                // set colors according to attached information
                if (d.average) {
                    classes += (d.average.bitRate < that.options.generalConfig.treshold ? " color_nok" : " color_ok");
                }
                return classes;
            });
            // set the tooltip for the path
            paths.select("title")
                .text(function (d) {
                    if (!d.average) {
                        return "no data";
                    } else {
                        return "Average"
                            + "\nRound Trip Time: " + d.average.roundTripTime
                            + "\nBit Rate: " + d.average.bitRate
                            + "\nCount: " + d.average.count
                            + "\n\nWorst"
                            + "\nRound Trip Time: " + d.worst.roundTripTime
                            + "\nBit Rate: " + d.worst.bitRate
                            + "\nCount: " + d.worst.count;
                    }
                });
            //paths.exit().remove();
        };

        //---------------------------------------------------
        // drawCheckboxes
        //---------------------------------------------------
        EchoFactory.prototype.drawCheckboxes = function() {
            var that = this;
            return that.svg.selectAll("foreignObject.checkbox")
                .data(d3.values(that.checkboxes.lvlA).concat(
                    d3.values(that.checkboxes.lvlB), d3.values(that.checkboxes.lvlC)))
                .enter()
                .append("foreignObject")
                .attr("class", "foreignCheckbox")
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                })
                .append("xhtml:input")
                .attr("type", "checkbox")
                .property("checked", function (d) {
                    return d.checked;
                })
                .on('change', function (d) {
                    onCheckboxClick(this, Number(d.level), Number(d.nodeId), Number(d.lvlBIdx), Number(d.connIdx));
                });

            //---------------------------------------------------
            function onCheckboxClick(checkbox, level, nodeId, bNode, cConn) {
                //alert(level + ' hi!');
                var i, checkboxes, targetNodes, targetNodeId, key, targetCheckbox,
                    changed = false,
                    nodes = that.nodes,
                    links = that.nodeLinks;

                if (level === 0) { // a level A checkbox
                    that.checkboxes.lvlA[nodeId].checked = checkbox.checked;
                    checkboxes = that.checkboxes.lvlB;
                    targetNodes = d3.values(nodes.lvlB).
                        filter(function (node) {
                            return checkboxes[node.id].checked;
                        });
                    if (checkbox.checked) {
                        // add links to all active level B nodes
                        targetNodes.forEach(function (node) {
                            i = that.linkIndexOf(links, nodeId, node.id);
                            if (!links[i].active) {
                                links[i].active = true;
                                changed = true;
                            }
                        });
                    } else { // if !checkbox.checked
                        // remove links from all active level B nodes
                        targetNodes.forEach(function (node) {
                            i = that.linkIndexOf(links, nodeId, node.id);
                            if (links[i].active) {
                                links[i].active = false;
                                changed = true;
                            }
                        });
                    } // if checkbox.checked

                } else if (level === 1) { // a level B checkbox
                    that.checkboxes.lvlB[nodeId].checked = checkbox.checked;

                    // update A-B links
                    checkboxes = that.checkboxes.lvlA;
                    targetNodes = d3.values(nodes.lvlA).
                        filter(function (node) {
                            return checkboxes[node.id].checked;
                        });
                    if (checkbox.checked) {
                        // add links to all active level A nodes
                        targetNodes.forEach(function (node) {
                            i = that.linkIndexOf(links, node.id, nodeId);
                            if (!links[i].active) {
                                links[i].active = true;
                                changed = true;
                            }
                        });
                    } else { // if !checkbox.checked
                        // remove links from all active level A nodes
                        targetNodes.forEach(function (node) {
                            i = that.linkIndexOf(links, node.id, nodeId);
                            if (links[i].active) {
                                links[i].active = false;
                                changed = true;
                            }
                        });
                    } // if checkbox.checked

                    // update B-C links
                    for (targetNodeId in nodes.lvlC) {
                        for (conn = 0; conn < 2; conn++) {
                            key = "" + targetNodeId + nodes.lvlB[nodeId].index + conn;
                            if (that.checkboxes.lvlC[key].checked) {
                                i = that.linkIndexOf(links, nodeId, targetNodeId, conn);
                                if (checkbox.checked) {
                                    // add links to all active level C nodes
                                    if (!links[i].active) {
                                        links[i].active = true;
                                        changed = true;
                                    }
                                } else { // if !checkbox.checked
                                    // remove links from all active level C nodes
                                    if (links[i].active) {
                                        links[i].active = false;
                                        changed = true;
                                    }
                                } // if checkbox.checked
                            }
                        }
                    }

                } else if (level === 2) { // a level C checkbox
                    key = "" + nodeId + bNode + cConn;
                    that.checkboxes.lvlC[key].checked = checkbox.checked;

                    targetNodeId = that.nodesArray.lvlB[bNode].id;
                    targetCheckbox = that.checkboxes.lvlB[targetNodeId];
                    if (targetCheckbox.checked) {
                        if (checkbox.checked) {
                            // add the link to relevant level B node, if it's active
                            i = that.linkIndexOf(links, targetNodeId, nodeId, cConn);
                            if (!links[i].active) {
                                links[i].active = true;
                                changed = true;
                            }
                        } else { // if !checkbox.checked
                            // remove the link to the relevant level B node
                            i = that.linkIndexOf(links, targetNodeId, nodeId, cConn);
                            if (links[i].active) {
                                links[i].active = false;
                                changed = true;
                            }
                        } // if checkbox.checked
                    } // if (targetCheckbox.checked) {

                } // if (level == )

                if (changed) {
                    that.drawLinks();
                    //that.draw(that.layout()); // recompute layout & redraw
                }

                //---------------------------------------------------
            };
        };

        //---------------------------------------------------
        // linkIndexOf
        // Find index of a link in a links array
        //---------------------------------------------------
        EchoFactory.prototype.linkIndexOf = function (links, id0, id1, conn) {
            // allow searching for a link in array form too
            if (id0 instanceof Array) {
                if (id0[1] instanceof Array) {
                    id1 = id0[1][0];
                    conn = id0[1][1];
                } else {
                    id1 = id0[1];
                }
                id0 = id0[0];
            }
            // now find link
            var isAB = (typeof conn === "undefined");
            for (var i = 0, len = links.length; i < len; i++) {
                var link = links[i];
                if (!(link instanceof Array)) {
                    link = link.segment;
                }
                if (isAB) {
                    if (link[0] == id0 && link[1] == id1) return i;
                } else {
                    if (link[0] == id0 && link[1][0] == id1 && link[1][1] == conn) return i;
                }
            }
            return -1;
        };

        /*
         //---------------------------------------------------
         // abLinkIndexOf
         // Find index of an A-B link in a links array
         //---------------------------------------------------
         EchoFactory.prototype.abLinkIndexOf = function (links, id0, id1) {
         for (var i = 0, len = links.length; i < len; i++) {
         var link = links[i];
         if (!(link instanceof Array)) {link = link.segment;}
         if (link[0] == id0 && link[1] == id1) return i;
         //if (arrayToSearch[i][0] == id0 && arrayToSearch[i][1] == id1) return i;
         }
         return -1;
         };

         //---------------------------------------------------
         // bcLinkIndexOf
         // Find index of a B-C link in a links array
         //---------------------------------------------------
         EchoFactory.prototype.bcLinkIndexOf = function (links, id0, id1, id2) {
         for (var i = 0, len = links.length; i < len; i++) {
         var link = links[i];
         if (!(link instanceof Array)) {link = link.segment;}
         if (link[0] == id0 && link[1][0] == id1 && link[1][1] == id2) return i;
         //if (arrayToSearch[i][0] == id0 && arrayToSearch[i][1][0] == id1 && arrayToSearch[i][1][1] == id2) return i;
         }
         return -1;
         };
         */

        //---------------------------------------------------
        // initNodes
        //---------------------------------------------------
        EchoFactory.prototype.initNodes = function (nodesArray) {
            this.nodesArray = nodesArray;
            // build nodes data structure from config object
            this.noOfLvlANodes = nodesArray.lvlA.length;
            this.noOfLvlBNodes = nodesArray.lvlB.length; // should be 2
            this.noOfLvlCNodes = nodesArray.lvlC.length;
            this.nodes = {
                lvlA: {},
                lvlB: {},
                lvlC: {}
            };
            var i, _id;
            for (i = 0; i < this.noOfLvlANodes; i++) {
                _id = nodesArray.lvlA[i].id;
                this.nodes.lvlA[_id] = {
                    id: _id,
                    index: i,
                    label: nodesArray.lvlA[i].label,
                    imgUrl: nodesArray.lvlA[i].imgUrl
                };
            }
            for (i = 0; i < this.noOfLvlBNodes; i++) {
                _id = nodesArray.lvlB[i].id;
                this.nodes.lvlB[_id] = {
                    id: _id,
                    index: i,
                    label: nodesArray.lvlB[i].label,
                    imgUrl: nodesArray.lvlB[i].imgUrl
                };
            }
            for (i = 0; i < this.noOfLvlCNodes; i++) {
                _id = nodesArray.lvlC[i].id;
                this.nodes.lvlC[_id] = {
                    id: _id,
                    index: i,
                    label: nodesArray.lvlC[i].label,
                    imgUrl: nodesArray.lvlC[i].imgUrl
                };
            }
        };

        //---------------------------------------------------
        // initNodeLinks
        //---------------------------------------------------
        EchoFactory.prototype.initNodeLinks = function (initialLinks) {
            var idA, idB, idC, conn, link, idx, key;
            this.checkboxes = {lvlA: {}, lvlB: {}, lvlC: {}};
            this.nodeLinks = [];

            // init level A checkboxes
            for (idA in this.nodes.lvlA) {
                this.checkboxes.lvlA[idA] = {
                    level: 0,
                    nodeId: idA
                };
            }

            // init level A checkboxes
            for (idB in this.nodes.lvlB) {
                this.checkboxes.lvlB[idB] = {
                    level: 1,
                    nodeId: idB
                };
            }

            // init level A - level B links & checkboxes
            for (idA in this.nodes.lvlA) {
                for (idB in this.nodes.lvlB) {
                    link = {segment: [this.nodes.lvlA[idA].id, this.nodes.lvlB[idB].id]};
                    link.active = this.linkIndexOf(initialLinks, idA, idB) !== -1;
                    this.nodeLinks.push(link);
                    if (link.active) {
                        this.checkboxes.lvlA[idA].checked = true;
                        this.checkboxes.lvlB[idB].checked = true;
                    }
                }
            }

            // init level B - level C links & checkboxes
            for (idB in this.nodes.lvlB) {
                for (idC in this.nodes.lvlC) {
                    for (conn = 0; conn < 2; conn++) {
                        link = {segment: [this.nodes.lvlB[idB].id, [this.nodes.lvlC[idC].id, conn]]};
                        link.active = this.linkIndexOf(initialLinks, idB, idC, conn) !== -1;
                        this.nodeLinks.push(link);
                        // init level C checkboxes
                        idx = this.nodes.lvlB[idB].index;
                        key = "" + idC + idx + conn;
                        this.checkboxes.lvlC[key] = {
                            level: 2,
                            nodeId: idC,
                            lvlBIdx: idx,
                            connIdx: conn
                        };
                        if (link.active) {
                            this.checkboxes.lvlB[idB].checked = true;
                            this.checkboxes.lvlC[key].checked = true;
                        }
                    }
                }
            }
        };

        //---------------------------------------------------
        // helloAPI (test method)
        //---------------------------------------------------
        EchoFactory.prototype.hello = function (name) {
            console.log("Hello, " + name + "!");
        };

        //---------------------------------------------------
        // setPaths (exposed API method)
        // Let the caller update the paths with information
        //---------------------------------------------------
        EchoFactory.prototype.setPaths = function (paths) {
            var that = this;
            var index;
            paths.forEach(function (link) {
                // Accept also a link as an array, not just a link as an object
                if (link instanceof Array) {
                    link = {segment: link}
                }
                // Find the link in the internal links array
                index = that.linkIndexOf(that.nodeLinks, link.segment);
                //if (!(link.segment[1] instanceof Array)) {
                //    index = that.linkIndexOf(that.nodeLinks, link.segment[0], link.segment[1]);
                //} else {
                //    index = that.linkIndexOf(that.nodeLinks, link.segment[0], link.segment[1][0], link.segment[1][1]);
                //}

                // Add the given information to the link
                if (index !== -1) {
                    that.nodeLinks[index].average = link.average;
                    that.nodeLinks[index].worst = link.worst;
                }
            });
            that.drawLinks();
        };

        //---------------------------------------------------
        // restoreInitialLinks
        //---------------------------------------------------
        EchoFactory.prototype.restoreInitialLinks = function () {
            //var that = this;
            //// restore links
            //this.nodeLinks.forEach(function (link) {
            //    link.active = (that.linkIndexOf(that.defaultPaths, link.segment) !== -1);
            //    delete link.average;
            //    delete link.worst;
            //});
            this.nodeLinks = angular.copy(this.initialLinks);
            this.checkboxes = angular.copy(this.initialCheckboxes);
            // redraw
            this.drawLinks();
            this.drawCheckboxes();
        };

        //---------------------------------------------------
        // send (to caller app)
        //---------------------------------------------------
        EchoFactory.prototype.send = function () {
            console.log('In send() method');
            this.options.form.submitCallback(
                this.formValues,
                this.nodeLinks.filter(function (link) {
                    return link.active;
                }).map(function (link) {
                    return link.segment;
                })
            );
        };

        // ---
        return EchoFactory;
    });