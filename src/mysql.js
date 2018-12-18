'use strict';

const BasePlugin = require('./base');
const exec = require('child_process').exec;
const exists = require('fs').existsSync;
const is = require('is_js');
const series = require('async/series');
const unlink = require('fs').unlinkSync;

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

        series([
            done => {
                const archive = `${ this.options.path }/${ this.options.filename }.sql`;
                if (exists(archive) && !this.options.overwrite)
                    return done(new Error('backup file already exists'));

                if (is.not.string(options.databases))
                    options['--all-databases'] = false;

                options[`> ${ archive }`] = false;
                let command = this._command(options, 'mysqldump');
                if (is.not.string(command)) return cb(new Error('invalid options for mysqldump'));
                exec(command, error => {
                    if (!exists(archive)) return done(error || new Error('mysqldump failed'));

                    this.success(command);
                    done();
                });
            },
            done => {
                const archive = `${ this.options.path }/${ this.options.filename }.tar.gz`;
                if (exists(archive) && !this.options.overwrite)
                    return done(new Error('backup file already exists'));

                let command = this._command({ '-C': false, [this.options.path]: false, '-czvf': false,
                    [archive]: false, [`${ this.options.filename }.sql`]: false }, 'tar');
                if (is.not.string(command)) return cb(new Error('invalid options for tar'));
                exec(command, error => {
                    if (!exists(archive)) return done(error || new Error('archiving failed'));

                    unlink(`${ this.options.path }/${ this.options.filename }.sql`);
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