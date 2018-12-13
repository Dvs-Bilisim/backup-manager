'use strict';

const colors = require('colors/safe');
const exec = require('child_process').exec;
const exists = require('fs').existsSync;
const files = require('fs').readdir;
const formatDate = require('date-fns/format');
const is = require('is_js');
const joinPath = require('path').join;
const stats = require('fs').statSync;
const tmpdir = require('os').tmpdir;
const unlink = require('fs').unlink;

class BasePlugin {
    constructor(options = {}) {
        if (is.not.object(options) || is.array(options))
            throw new Error('options parameter must be an object');

        this.options = {
            path: joinPath(tmpdir(), './backup'),
            filename: `backup-${ formatDate(new Date(), 'YYYYMMDDHH') }`,
            size: 100 * 1024 * 1024, // max total size of backup files in bytes
            min: 3, // at least 3 backups should be kept
            overwrite: false
        };
        this.configure(options);
    }

    /**
     * @description Overwrites current options
     * @param {Object} options
     * @memberof Base
     */
    configure(options) {
        this.options = Object.assign(this.options || {}, options);
        if (is.not.string(this.options.path) || !exists(this.options.path))
            throw new Error('invalid path for backup files');
    }

    /**
     * @description Returns human readable form of file size
     * @param {Number} bytes file size in bytes
     * @memberof Base
     */
    humanReadableFileSize(bytes) {
        const thresh = 1024;
        if(Math.abs(bytes) < thresh) return bytes + ' B';
        const units = [ 'KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB' ];
        let u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return `${ bytes.toFixed(1) } ${ units[u] }`;
    }

    /**
     * @description Removes an old backup if options has been satisfied
     * @param {Function} cb callback
     * @memberof Base
     */
    purge(cb) {
        this.fetchFiles(backups => {
            if (backups.length < this.options.min) {
                this.warning(`Number of backups (${ backups.length } files) are less than ${ this.options.min }.`);
                return cb();
            }

            let size = 0;
            for (let file of backups) {
                const info = stats(`${ this.options.path }/${ file }`);
                size += info.size;
            }
            if (size < this.options.size) {
                this.warning(`Total size of backups (${ this.humanReadableFileSize(size) }) are not greater than ${ this.humanReadableFileSize(this.options.size) }`);
                return cb();
            }

            const file = backups.shift();
            const path = `${ this.options.path }/${ file }`;
            const info = stats(path);
            unlink(path, error => {
                if (error) return cb(error);

                this.success(`An old backup called ${ file } (${ this.humanReadableFileSize(info.size) }) deleted!`);
                cb();
            });
        });
    }

    /**
     * @description Returns recent backup file
     * @param {Function} cb callback
     * @memberof Base
     */
    recentBackupFile(cb) {
        this.fetchFiles(backups => cb(backups.pop()));
    }

    /**
     * @description Returns only files in a folder
     * @memberof Base
     */
    fetchFiles(cb) {
        files(this.options.path, (error, backups) => {
            const files = [];
            if (is.array(backups) && is.not.empty(backups))
                for (let backup of backups)
                    if (stats(`${ this.options.path }/${ backup }`).isFile())
                        files.push(backup);
            cb(files);
        });
    }

    /**
     * @description Removes temporary folder
     * @param {String} [err] error
     * @param {Function} cb callback
     * @memberof Base
     */
    clearTemporaryFolder(err, cb) {
        if (is.function(err)) {
            cb = err;
            err = undefined;
        }
        const command = this._command({ '-Rf': false, [this.options.tmp]: false }, 'rm');
        if (is.not.string(command)) return cb(new Error('invalid options for rm'));
        exec(command, error => {
            if (error) return cb(error);

            cb(err);
        });
    }

    /**
     * @description Returns an executable command with correct parameters
     * @param {Object} options
     * @param {Function} [cb] callback
     * @memberof MongoDBPlugin
     */
    _command(options, bin) {
        if (is.not.object(options) || is.array(options))
            throw new Error('options parameter must be an object');

        const command = [ bin ];
        for (let option of Object.keys(options)) {
            if (is.string(options[option]))
                command.push(`--${ option } ${ options[option] }`);
            else if (is.boolean(options[option])) {
                if (options[option]) command.push(`--${ option }`);
                else command.push(option);
            }
        }
        return command.join(' ');
    }

    /**
     * @description Simple console logger
     * @param {String} icon
     * @param {String} color
     * @param {Any} message
     * @memberof Base
     */
    log(icon, color, message) {
        if (!this.options.debug) return;

        color = colors[color];
        if (is.not.function(color)) color = colors.red;
        console.log(color(icon), color(formatDate(new Date())), color(message));
    }

    /**
     * @description Simple console logger
     * @param {Any} message
     * @memberof Base
     */
    success(message) {
        this.log('✔', 'green', message);
    }

    /**
     * @description Simple console logger
     * @param {Any} message
     * @memberof Base
     */
    warning(message) {
        this.log('!', 'yellow', message);
    }

    /**
     * @description Simple console logger
     * @param {Any} message
     * @memberof Base
     */
    fail(message) {
        this.log('×', 'red', message);
    }
}

module.exports = BasePlugin;
