class Events {

    constructor(){

        this.cache = {}

    }

    publish(topic, args, scope){

        if (this.cache[topic]) {

            let thisTopic = this.cache[topic],
                i = thisTopic.length - 1;

            for (i; i >= 0; i -= 1) {

                if(typeof args === 'object'){

                    thisTopic[i].apply( scope || this, args || []);

                }else{

                    thisTopic[i](args);

                }

            }

        }

    }

    subscribe(topic, callback){

        if (!this.cache[topic]) {

            this.cache[topic] = [];

        }

        this.cache[topic].push(callback);

        return [topic, callback];

    }

    unsubscribe(handle, completly){

        let t = handle;
        let i;

        if(this.cache[t]){

            i = this.cache[t].length - 1;

        }else{

            i = 0;

        }

        if (this.cache[t]) {

            for (i; i >= 0; i -= 1) {

                if (this.cache[t][i] === completly) {

                    this.cache[t].splice(i, 1);

                    if(completly){ 
                        
                        delete this.cache[t]; 
                    
                    }

                }

            }

        }

    }

}

export let events = new Events() 
