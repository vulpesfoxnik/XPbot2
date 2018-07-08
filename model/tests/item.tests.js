const db = require('../../model');

db.models.Item.scope("purchasable").findAll({
    include: [
        {model: db.models.ItemType, as: "type"}
    ],
}).then((result) => {
    console.log(JSON.stringify(result[1], null, 2));
    let first = result[0];
    return first.getType();
}).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    // let hat =  db.models.Item.build({
    //     title: 'oversized_pimp_hat',
    //     titleView: 'Oversized Pimp Hat',
    //     exp: 100000,
    //     gold: 10000,
    //     itemTypeId: 3,
    //     notForSale: true
    // });
    // console.log(hat.getDataValue('notForSale'));
    // return hat.save()
    return 1;
}).then((result) => console.log(result)).catch((err) => console.error(err));



