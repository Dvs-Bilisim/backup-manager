'use strict';

const BasePlugin = require('./base');
const exec = require('child_process').exec;
const exists = require('fs').existsSync;
const files = require('fs').readdirSync;
const is = require('is_js');
const series = require('async/series');

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

        this.configure({ tmp: `${ this.options.path }/tmp/backup-${ Math.random().toString().replace('.', '') }` });
        options.out = this.options.tmp;

        series([
            done => {
                let command = this._command(options, 'mongodump');
                if (is.not.string(command)) return cb(new Error('invalid options for mongodump'));
                exec(command, error => {
                    if (!exists(this.options.tmp)) return done(error || new Error('mongodump failed'));

                    this.success(command);
                    done();
                });
            },
            done => {
                const backups = files(this.options.tmp);
                if (is.not.array(backups) || !backups.length) return done(new Error(''));

                const archive = `${ this.options.path }/${ this.options.filename }.tar.gz`;
                let command = this._command({ '-C': false, [this.options.tmp]: false, '-czvf': false,
                    [archive]: false, [backups.join(' ')]: false }, 'tar');
                if (is.not.string(command)) return cb(new Error('invalid options for tar'));
                exec(command, error => {
                    if (!exists(archive)) return done(error || new Error('archiving failed'));

                    this.success(command);
                    done();
                });
            }
        ], error => {
            if (error)  {
                this.fail(error.message);
                return this.clearTemporaryFolder(error, cb);
            }

            this.clearTemporaryFolder(error => {
                if (error) this.fail(error.message);
                this.purge(cb);
            });
        });
    }
}

module.exports = MongoDBPlugin;
