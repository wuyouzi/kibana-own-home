import createKibanaIndex from './create_kibana_index';
import migrateConfig from './migrate_config';
import getReplacedIndex from './get_replaced_index';
import createClient from './create_client';

module.exports = function (server, req, path, mappings) {

  const config = server.config();

  const replacedIndex = getReplacedIndex(server, req);

  if (replacedIndex) {
    const originalIndex = config.get('kibana.index');

    if (path.indexOf(originalIndex) > -1 && path.indexOf(replacedIndex) === -1) {
      const reOriginalIndex = RegExp('(\\/)' + originalIndex + '(\\/|$)');
      path = path.replace(reOriginalIndex, "$1" + replacedIndex + "$2");
      server.log(['plugin:own-home', 'debug'], 'Replace kibana.index "' + originalIndex + '" with "' + replacedIndex + '"');
      server.log(['plugin:own-home', 'debug'], 'Replaced path: ' + path);

      // Check replaced kibana index exists
      const client = createClient(server);
      client.indices.exists({ index: replacedIndex }).then(function (exists) {
        if (exists === true) {
          // Ignore 409 error: 'document_already_exists_exception'
          return migrateConfig(server, replacedIndex, [409], mappings);
        } else {
          return createKibanaIndex(server, replacedIndex, mappings);
        }
      });
    }
  }

  return path;
};
