function EV3CodeGenerator(ide) {
    this.ide = ide;
    this.varNumber = 0;
}

EV3CodeGenerator.prototype.exportEV3Code = function () {
    try {
        msg = this.ide.showMessage('Generating EV3 code...');
        code = this.generateStage(this.ide.stage);
        msg.destroy();
        if (code.length > 0) {
            this.ide.saveFileAs(code, 'text/py;charset=utf-8', 'ev3program');
        }
    } catch (err) {
        if (Process.prototype.isCatchingErrors) {
            this.ide.showMessage('Code generation failed: ' + err);
        } else {
            throw err;
        }
    }
};


EV3CodeGenerator.prototype.generateStage = function(stage) {
    // stub
    return '#!/usr/bin/env python\nimport ev3dev.ev3 as ev3\n'
};
