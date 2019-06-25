var PG = require('pg');

module.exports = {
	get_card_info: function(server_id, cid, callback, bad) {
		var select_query = "SELECT url, xp, upval, downval, leftval, rightval, char_id, name FROM Cards WHERE server_id = $1 AND char_id = $2";
		var query_values = [server_id, cid];
		var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
		pool.query(select_query, query_values, (err, result) => {
			if (err) {
				console.log('error occurred');
				return console.error('Error executing query', err.stack);
			}
			//No returned rows indicate provided key is not associated with any row
			else if (result.rows.length == 0)bad('No entry found. Check name given and ownership.')
			//successfully found a result. Passes associated value to the callback function
			else callback(result.rows[0]);
			}); //end pool.query 
		pool.end()	
	},
