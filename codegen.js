function EV3CodeGenerator(ide) {
    this.ide = ide;
    this.varNumber = 0;
}


EV3CodeGenerator.prototype.freshVar = function (ident) {
    this.varNumber += 1;
    return ident + '_' + this.varNumber;
};


EV3CodeGenerator.prototype.exportEV3Code = function() {
    code = this.generateCode();
    if (code.length > 0) {
        this.ide.saveFileAs(code, 'text/py;charset=utf-8', 'ev3program');
    }
};


EV3CodeGenerator.prototype.deployEV3Code = function() {
    code = this.generateCode();

    var data = new FormData();
    data.append('code', code);
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/ev3/deploy', true);
    xhr.onload = function() {
        console.log(this.responseText);
    }
    xhr.send(data)
};


EV3CodeGenerator.prototype.generateCode = function() {
    try {
        msg = this.ide.showMessage('Generating EV3 code...');
        code = this.generateStage(this.ide.stage);
        msg.destroy();
        return code;
    } catch (err) {
        if (Process.prototype.isCatchingErrors) {
            this.ide.showMessage('Code generation failed: ' + err);
        } else {
            throw err;
        }
    }
    return "";
};


EV3CodeGenerator.prototype.generateStage = function(stage) {

    var ev3Sprite = stage.children.find(function(sprite, idx, arr) {
        return sprite.name == 'Robot';
    });

    if (! ev3Sprite) {
        this.ide.showMessage('Program sprite is missing');
        return '';
    }

    var toplevelBlocks = ev3Sprite.scripts.children;
    if (toplevelBlocks.length == 0) {
        this.ide.showMessage('No code to generate: add some blocks first!');
        return '';
    }

    // Mapping from procedure names (string) to code (string)
    var procedures = {};

    // Mapping from event names (string) to lists of procedure names
    var eventHandlers = {};
    
    var len, i;
    for (len = toplevelBlocks.length, i = 0; i < len; i++) {
        var block = toplevelBlocks[i];
        var event = '';
        var procName = '';
        
        switch (block.selector) {
        case 'receiveGo':
            event = 'START';
            procName = 'onStart_' + i;
            break;
        case 'receiveMessage':
            var msg = block.inputs()[0].contents().text;
            event = 'MSG_' + msg;
            procName = 'onMessage_' + msg + '_' + i;
            break;
        default:
            // skip this block
        }

        if (! event) {
            continue;
        }

        if (! (event in eventHandlers)) {
            eventHandlers[event] = [];
        }
        eventHandlers[event].push(procName);

        var procCode = 'def ' + procName + '():\n';
        if (! block.nextBlock()) {
            procCode += '    pass;\n';
        } else {
            procCode += this.codeForBlock(block.nextBlock(), 1);
        }
        
        procedures[procName] = procCode;
    }

    var code = 'from __future__ import print_function\n'
        + 'import time\n\n'
        + 'import ev3dev.ev3 as ev3\n'
        + 'from runtime import broadcast\n\n';

    code += 'handlers = {}\n\n';
    
    for (event in eventHandlers) {
        code += '# Handlers for event "' + event + '"\n'
             +  'handlers["' + event + '"] = []\n\n';
        var handlers = eventHandlers[event];
        var len, i;
        for (len = handlers.length, i = 0; i < len; i++) {
            code += procedures[handlers[i]] + '\n';
            code += 'handlers["' + event + '"].append(' + handlers[i] + ')\n\n';
        }
    }

    code += '\n\n# Broadcast START\n'
         +  'broadcast(handlers, "START")\n';

    return code;
};


EV3CodeGenerator.prototype.codeForBlock = function(block, indentLevel) {

    var code = '    '.repeat(indentLevel);

    switch (block.selector) {
    case 'doBroadcast':
        var msg = block.inputs()[0].contents().text;
        event = 'MSG_' + msg;
        code += 'broadcast(handlers, "' + event + '")\n';
        break;
    case 'doRepeat':
        var count = block.inputs()[0].contents().text;
        code += 'for ' + this.freshVar('i') + ' in range(0, ' + count + '):\n';
        var body = block.inputs()[1].nestedBlock();
        code += this.codeForBlock(body, indentLevel + 1);
        break;
    case 'doWait':
        var duration = block.inputs()[0].contents().text;
        code += 'time.sleep(' + duration + ')\n';
        break;

    case 'bubble': // print message on EV3's display
        var text = block.inputs()[0].contents().text;
        code += 'print("Robot: ' + text + '")\n';
        break;
    case 'doThink': // log message on EV3's console
        var text = block.inputs()[0].contents().text;
        code += 'print("' + text + '")\n';
        break;
        
    default:
        code += 'pass # No code for block type "' + block.selector + '"\n'
    }

    if (block.nextBlock()) {
        code += this.codeForBlock(block.nextBlock(), indentLevel);
    }
    return code;
};
