function EV3CodeGenerator(ide) {
    this.ide = ide;
    this.varNumber = 0;
}


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
    // stub
    return '#!/usr/bin/env python\nimport ev3dev.ev3 as ev3\n'
};
