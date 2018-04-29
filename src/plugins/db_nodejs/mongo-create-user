var user;

use {{database.dbname_mongo}} 

user = db.getUser("{{database.username_mongo}}");

if(!user){

    db.createUser(
        {
            user: "{{database.username_mongo}}",
            pwd: "{{database.password_mongo}}",
            roles: [{ 
                role: "dbOwner", 
                db: "{{database.dbname_mongo}}"
            }]
        }
    )

}

