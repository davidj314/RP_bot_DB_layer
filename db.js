var PG = require('pg');
var Discord = require('discord.js');
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
	
	lvl_card: function(server_id, direction, char_id){
		var update_query = "UPDATE Cards Set "+ direction + "=" +direction + "+1 WHERE server_id=$1 AND char_id=$2";
		var values = [server_id, char_id];
		var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
		pool.query(update_query, values,  (err, res) => {
			if (err) console.log(err, res);
			pool.end();
		});
	},

	set_xp: function(server_id, xp, char_id){
		var update_query = "UPDATE Cards Set xp = $3 WHERE server_id=$1 AND char_id=$2";
		var values = [server_id, char_id, xp];
		var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
		pool.query(update_query, values,  (err, res) => {
			if (err) console.log(err, res);
			pool.end();
		});
	},
	
	insert_user_set_char: function(server_id, user_id, set_char, callback){
		var insert_query = "INSERT INTO Trainings(server_id, user_id, set_char) Values($1, $2,$3)";
		var values = [server_id, user_id, set_char];
		var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
		pool.query(insert_query, values,  (err, res) => {
			if (err){
			    if(err.code == '23505'){
				update_training(server_id, user_id, set_char, callback);
			    }
			    else{
				callback("Failed to set training card. Check command syntax (rp!set_training 22)")
				console.log(err, res);
			    }
			}
			else{
				callback (`Now training card of id ${set_char}`);	
			}
			pool.end();
		});
	},
	
	insert_new_pack_count: function(server_id, user_id){
		var insert_query = "INSERT INTO Packs(server_id, user_id, Packs) Values($1, $2, 6)";
		var values = [server_id, user_id];
		var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
		pool.query(insert_query, values,  (err, res) => {
			if (err){
				if(err.code == '23505') increment_packs(server_id, user_id);
			}
			pool.end();
		});
	},

	starter_pack: function(server_id, user_id){
		var insert_query = "INSERT INTO Packs(server_id, user_id, Packs) Values($1, $2, 5)";
		var values = [server_id, user_id];
		var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
		pool.query(insert_query, values,  (err, res) => {
			if (err) console.log(err, res);
			pool.end();
		});
	},
	
	get_training: function(server_id, user_id, callback)
	{
		var select_query = "SELECT set_char FROM Trainings WHERE server_id = $1 AND user_id = $2";
		var values = [server_id, user_id];
		var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
		pool.query(select_query, values,(err, result) => {
			console.log(result);
			if (err) {
			    console.log('error occurred');
			    return console.error('Error executing query', err.stack);
			}
			else if (result.rows.length == 0) {
			    return;
			}
			//successfully found a result. Passes rows to the callback function
			else{
				callback(result.rows[0].set_char)
			}
		 }); //end pool.query 
		 pool.end() 
	},

	pop_pack: function(server_id, user_id, callback, bad)
	{
		var select_query = "SELECT packs FROM Packs WHERE server_id = $1 AND user_id = $2";
		var values = [server_id, user_id];
		var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
		pool.query(select_query, values, (err, result) => {
			console.log(result);
			if (err) {
			    console.log('error occurred');
			    return console.error('Error executing query', err.stack);
			}
			//No returned rows indicate provided key is not associated with any row
			else if (result.rows.length == 0) {
			    console.log('No rows returned')
			    return;
			}
			else{
				if (result.rows[0].packs < 1)bad('You have no packs');
				else {
					decrement_packs(server_id, user_id);   
					callback(server_id, user_id);
				}
			}
		 }); //end pool.query 
		 pool.end() 
	},

	get_triggers: function(callback){
	    var select_query = "SELECT server_id, channel_id, message_id FROM Triggers";
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, (err, result) => {
		console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    console.log('No rows returned')
		    return;
		}
		//successfully found a result. Passes rows to the callback function
		else{
		    callback(result.rows)   
		}
	    }); //end pool.query 
	    pool.end()    
	},

	check_trigger: function(server_id, message_id, emoji, callback){
	    console.log("Emoji is "+emoji);
	    var select_query = "SELECT role_snowflake FROM Triggers WHERE server_id = $1 AND message_id=$2 AND emoji=$3";
	    var query_values = [server_id, message_id, emoji];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    console.log('No rows returned in check_trigger')
		    return;
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows[0].role_snowflake)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function


	get_lookup_val: function(server_id, key, callback){
	    var select_query = "SELECT infoval FROM Lookup WHERE server_id = $1 AND infokey = $2";
	    var query_values = [server_id, key];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    callback('No entry found for ' + key)
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows[0].infoval)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function
	
	get_char_id: function(server_id, owner_id, name, callback, bad){
	    var select_query = "SELECT id FROM Names WHERE server_id = $1 AND Name = $2 AND owner_id=$3";
	    var query_values = [server_id, name, owner_id];
	    console.log(`SELECT id FROM Names WHERE server_id = ${server_id} AND Name = ${name} AND owner_id=${owner_id}`);
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		//console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Check name given and ownership.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows[0].id)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function

	get_all_cards: function(server_id, callback, bad){
	    var select_query = "SELECT Cards.char_id, Cards.name, Cards.upval, Cards.leftval, Cards.rightval, Cards.downval  FROM Cards INNER JOIN Names ON Cards.char_id=Names.id WHERE Cards.server_id = $1 AND Names.server_id=$1";
	    var query_values = [server_id];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Perhaps there are no cards.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function

	get_user_cards: async function(server_id, owner_id, callback, bad){
	    var select_query = "SELECT Card_Inv.cid, Cards.name, Cards.upval, Cards.leftval, Cards.rightval, Cards.downval, Cards.url  FROM Cards INNER JOIN Names ON Cards.char_id=Names.id INNER JOIN Card_Inv ON Cards.char_id = Card_Inv.cid WHERE Card_Inv.server_id = $1 AND Card_Inv.owner_id = $2";
	    var query_values = [server_id, owner_id];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		//console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Perhaps you have no cards.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function

	get_user_made_cards: function(server_id, owner_id, callback, bad){
	    var select_query = "SELECT Cards.char_id, Cards.name, Cards.upval, Cards.leftval, Cards.rightval, Cards.downval, Cards.xp  FROM Cards INNER JOIN Names ON Cards.char_id=Names.id WHERE Cards.server_id = $1 AND Cards.owner_id = $2";
	    var query_values = [server_id, owner_id];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Perhaps you have no cards.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows)   
		}
	    }); //end pool.query 
	    pool.end()
	},//end function

	get_card_info: function(server_id, cid, callback, bad){
	    var select_query = "SELECT url, xp, upval, downval, leftval, rightval, char_id, name FROM Cards WHERE server_id = $1 AND char_id = $2";
	    var query_values = [server_id, cid];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
	       // console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Check name given and ownership.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows[0]);
		}
	    }); //end pool.query 
	    pool.end()
	},//end function

	get_card_list: function(server_id, callback, bad){
	    var select_query = "SELECT url, upval, downval, leftval, rightval FROM Cards WHERE server_id = $1";
	    var query_values = [server_id];
	    var pool = new PG.Pool({ connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
	       // console.log(result);
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		//No returned rows indicate provided key is not associated with any row
		else if (result.rows.length == 0) {
		    bad('No entry found. Check name given and ownership.')
		}
		//successfully found a result. Passes associated value to the callback function
		else{
		    callback(result.rows);
		}
	    }); //end pool.query 
	    pool.end()

	},//end function

	get_authors_names: function(server_id, author_id, callback)
	{
	    //"NoNicknameOrIDMatch" is a default value passed when there is no ID associated with the provided nickname/username
	    if (author_id == "NoNicknameOrIDMatch"){
		callback('No user by that name found'); 
		return;
	    }
	    var select_query = "SELECT Name FROM Names WHERE server_id = $1 AND owner_id = $2";
	    var query_values = [server_id, author_id];
	    var pool = new PG.Pool({connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		if (err) {
		    return console.error('Error executing query', err.stack);
		}
		//no rows found indicates that the user does not have a character name associated with them
		else if (result.rows.length == 0) {
		    callback('No characters found')
		}
		//rows returning means user has 1 or more character names associated with them
		//use callback function on a per-row basis
		else{
		    var txt = 'Characters belonging to that person:\n';
		    var i;
		    for (i=0;i < result.rows.length; i++){
			txt += result.rows[i].name;
			txt += "\n";
		    }
		    callback(txt)   
		}
	    });//end pool.query
	    pool.end()
	},//end function

	//obtains all keys with associated values and uses callback function on a string containing all
	get_all_vals: function(server_id, callback)
	{
	    var select_query = "SELECT infokey FROM Lookup WHERE server_id = $1";
	    var query_values = [server_id];
	    var pool = new PG.Pool({connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		else if (result.rows.length == 0) {
		    callback('No records found')
		}
		else{
		    var txt = 'Records retrievable with rp!find command:\n';
		    for (var i=0;i < result.rows.length; i++){
			txt += result.rows[i].infokey;
			txt += "\n";
		    }
		    callback(txt);   
		}
		console.log('no error');
	    });//end pool.query
	    pool.end()
	},//end function

	//obtains all character names associated with particular server_id and uses callback function on a string containing all
	get_all_names: function(server_id, callback)
	{
	    var select_query = "SELECT Name FROM Names WHERE server_id = $1";
	    var query_values = [server_id];
	    var pool = new PG.Pool({connectionString: process.env.DATABASE_URL, SSL: true});
	    pool.query(select_query, query_values, (err, result) => {
		if (err) {
		    console.log('error occurred');
		    return console.error('Error executing query', err.stack);
		}
		else if (result.rows.length == 0) {
		    callback('No characters found')
		}
		else{
		    var txt = '';
		    var i;
		    for (i=0;i < result.rows.length; i++){
			txt += result.rows[i].name;
			txt += "\n";
		    }
		    callback(txt);   
		}
		console.log('no error');
	    });//end pool.query
	    pool.end()
	},//end function

	//this function creates a row with given key-value pair to be accessed later.
	record_lookup: function(server_id, key, value, callback)
	{
	    var insert_query = "INSERT INTO Lookup (server_id, infokey, infoval) VALUES($1, $2, $3)";
	    var values = [server_id, key, value];
	    var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
	    // connection using created pool
	    pool.query(insert_query, values,  (err, res) => {
	    //23505
	    if (err){
		if(err.code == '23505')
		{
		    var error_string = 'The key ' + key + ' is already in use.'
		    callback(error_string)
		}
	    console.log(err, res);
	    }
	  pool.end();
	});
	}//end function
}


//-----------------------------------

function update_training(server_id, user_id, set_char, callback)
{
	var insert_query = "UPDATE Trainings SET set_char=$3 WHERE server_id=$1 AND user_id=$2";
	var values = [server_id, user_id, set_char];
	var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
	pool.query(insert_query, values,  (err, res) => {
		if (err){
		    console.log(err, res);
		    callback(`Failed to set training card`);
		}
		else{
			console.log('Training updated successfully');
			callback(`Now training card of id ${set_char}`);
		}
		pool.end();
   	});
}

function increment_packs(server_id, user_id)
{
	var insert_query = "UPDATE Packs SET Packs=Packs+1 WHERE server_id=$1 AND user_id=$2";
	var values = [server_id, user_id];
	console.log("Incrementing Pack");
	var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
	pool.query(insert_query, values,  (err, res) => {
		if (err){
			console.log(err, res);
		}
		else{
			console.log('Packs incremented successfully');	
		}
		pool.end();
   	});
}

function decrement_packs(server_id, user_id)
{
	var insert_query = "UPDATE Packs SET Packs=Packs-1 WHERE server_id=$1 AND user_id=$2";
	var values = [server_id, user_id];
	var pool = new PG.Pool({connectionString: process.env.DATABASE_URL,SSL: true});
	pool.query(insert_query, values,  (err, res) => {
		if (err){
		    console.log(err, res);
		}
		else{
			console.log('Packs decremented successfully');	
		}
		pool.end();
   	});
}
