'use strict';

const BasePlugin = require('./base');
const exec = require('child_process').exec;
const is = require('is_js');

class MongoDBPlugin extends BasePlugin {
    constructor(options = {}) {
        super(options);
    }

    /**
     * @description Creates a new backup
     * @param {Object} options
     * @param {Function} [cb] callback
     * @memberof MongoDBPlugin
     */
    backup(options, cb) {
        if (is.not.function(cb)) cb = function (e) { if (e) this.fail(e); };
        if (is.not.object(options) || is.array(options))
            return cb(new Error('options parameter must be an object'));

        if (is.not.string(options.archive))
            options.archive = `${ this.options.path }/${ this.options.filename }`;
        const command = this._command(options, true);
        if (is.not.string(command)) return cb(new Error('invalid options for mongodump'));
        exec(command, (error) => {
            if (error) return cb(error);

            this.success(command);
            this.purge(cb);
        });
    }


    /**
     * @description Returns an executable command with correct parameters
     * @param {Object} options
     * @param {Function} [cb] callback
     * @memberof MongoDBPlugin
     */
    _command(options, isBackup) {
        if (is.not.object(options) || is.array(options))
            throw new Error('options parameter must be an object');

        const command = [ isBackup ? 'mongodump' : 'mongorestore' ];
        for (let option of Object.keys(options)) {
            if (is.string(options[option])) {
                if (option === 'archive')
                    command.push(`--${ option }=${ options[option] }`);
                else command.push(`--${ option } ${ options[option] }`);
            } else if (is.boolean(options[option]) && options[option])
                command.push(`--${ option }`);
        }
        return command.join(' ');
    }
}

module.exports = MongoDBPlugin;
