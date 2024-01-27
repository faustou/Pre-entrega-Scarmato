const fs = require('fs');
const path = require('path');
const productosFile = './productos.json';
const carritosFile = './carrito.json';

const finished = (error) => {
    if (error) {
        console.error(error);
        return;
    }
};

let resp = 9099;

codes_translator = function (code) {
    switch (code) {
        case 9001:
            return 'Quantity not recognized';
            break;
        case 9002:
            return 'Product code repeated';
            break;
        case 9003:
            return 'Product added';
            break;
        case 9004:
            return 'Type mismatch';
            break;
        case 9005:
            return 'Missing Value';
            break;
        case 9101:
            return "Cart ID doesn't exist";
            break;
        case 9102:
            return 'Product in URL must match product in body';
            break;
        case 9099:
            return 'Transaction successful';
            break;

        default:
            return 'Status Unknown';
    }
};

class ProductsManager {
    constructor(file_path = process.cwd(), file = productosFile) {
        this.file_path = file_path;
        this.file = file;
        this.original_products = {};
        this.current_id = 0;

        if (!fs.existsSync(path.join(this.file_path, this.file))) {
            try {
                fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.original_products, null, 2));
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        }

        const read_products = fs.readFileSync(path.join(this.file_path, this.file), 'utf-8');
        this.products = JSON.parse(read_products);
        this.current_id = Object.keys(this.products)[Object.keys(this.products).length - 1];
    }

    getProducts() {
        if (this.current_id >= 1) {
            return this.products;
        } else {
            return undefined;
        }
    }

    addProduct(title, description, code, price, status = true, stock, category, thumbnails = []) {
        if (stock <= 0 || typeof stock != 'number') {
            resp = 9001;
            return resp;
        }

        let ids = [];
        let codes = [];
        Object.entries(this.products).forEach((producto) => {
            ids.push(producto[0]);
            codes.push(producto[1]['code']);
        });

        let max = Math.max(...ids);

        if (max == '-Infinity') {
            max = 0;
        }

        if (codes.includes(code)) {
            resp = 9002;
            return resp;
        }

        let this_item = {};

        this_item.id = max + 1;
        this_item.title = title;
        this_item.description = description;
        this_item.code = code;
        this_item.price = price;
        this_item.status = status;
        this_item.stock = stock;
        this_item.category = category;
        this_item.thumbnails = thumbnails;

        this.products[this_item.id] = this_item;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
        return resp;
    }

    editProduct(id, title, description, code, price, status = true, stock, category, thumbnails = []) {
        if (stock < 0 || typeof stock != 'number') {
            resp = 9001;
            return resp;
        }

        let this_item = this.products[id];

        this_item.id = id;
        this_item.title = title;
        this_item.description = description;
        this_item.code = code;
        this_item.price = price;
        this_item.status = status;
        this_item.stock = stock;
        this_item.category = category;
        this_item.thumbnails = thumbnails;

        this.products[id] = this_item;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
        return resp;
    }

    deleteProduct(id) {
        if (this.products[id]) {
            delete this.products[id];

            fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.products, null, 2), 'utf-8', finished);
            return resp;
        }
        return resp;
    }
}

exports.getProducts = (req, res) => {
    const all_products = new ProductsManager();
    const prod_list = all_products.getProducts();
    const max_products = Object.keys(all_products).length - 1;
    const new_limit = req.query.limit;

    if (prod_list === undefined) {
        res.status(404).json({
            success: true,
            message: `There are no products`,
            data: {},
        });
    }
    if (new_limit !== undefined) {
        if (new_limit > max_products || new_limit <= 0 || isNaN(new_limit)) {
            res.status(400).json({
                success: false,
                message: 'The limit must be greater than zero and equal or less to the total amount of products.',
                data: {},
            });
        } else {
            const sliced = Object.entries(prod_list).slice(0, new_limit);
            const plural = new_limit > 1 ? `fisrt ${new_limit} products` : `fisrt product`;
            res.status(200).json({
                success: true,
                message: `Here are the ${plural}`,
                data: sliced,
            });
        }
    } else {
        res.status(200).json({
            success: true,
            message: `Here are all the products`,
            data: prod_list,
        });
    }
};

exports.getProduct = (req, res) => {
    const all_products = new ProductsManager();
    const new_pid = req.params.pid;
    const selected_product = all_products['products'][new_pid];

    if (new_pid !== undefined && selected_product !== undefined) {
        if (new_pid <= 0 || isNaN(new_pid)) {
            res.status(400).json({
                success: false,
                message: `The ID must be greater than zero and has to exist in the products list.`,
                data: {},
            });
        } else {
            res.status(200).json({
                success: true,
                message: `Here is the product with the id ${new_pid}`,
                data: selected_product,
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: `The ID must be greater than zero and has to exist in the products list.`,
            data: {},
        });
    }
};

exports.postProduct = (req, res) => {
    const data = req.body;

    if (!data.title) {
        resp = 9005;
    } else if (typeof data.title !== 'string') {
        resp = 9004;
    }

    if (!data.description) {
        resp = 9005;
    } else if (typeof data.description !== 'string') {
        resp = 9004;
    }

    if (!data.code) {
        resp = 9005;
    } else if (typeof data.code !== 'string') {
        resp = 9004;
    }

    if (!data.price) {
        resp = 9005;
    } else if (typeof data.price !== 'number') {
        resp = 9004;
    }

    if (!data.stock) {
        resp = 9005;
    } else if (typeof data.stock !== 'number') {
        resp = 9004;
    }

    if (!data.category) {
        resp = 9005;
    } else if (typeof data.category !== 'string') {
        resp = 9004;
    }

    if (resp != 9099) {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }

    const all_products = new ProductsManager();
    const prod_list = all_products.addProduct(
        data.title,
        data.description,
        data.code,
        data.price,
        data.status,
        data.stock,
        data.category,
        data.thumbnails
    );

    if (prod_list == 9099) {
        res.status(200).json({
            success: true,
            message: codes_translator(resp),
            data: {},
        });
    } else {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }
};

exports.putProduct = (req, res) => {
    const new_pid = req.params.pid;
    const data = req.body;

    if (!data.title) {
        resp = 9005;
    } else if (typeof data.title !== 'string') {
        resp = 9004;
    }

    if (!data.description) {
        resp = 9005;
    } else if (typeof data.description !== 'string') {
        resp = 9004;
    }

    if (!data.code) {
        resp = 9005;
    } else if (typeof data.code !== 'string') {
        resp = 9004;
    }

    if (!data.price) {
        resp = 9005;
    } else if (typeof data.price !== 'number') {
        resp = 9004;
    }

    if (!data.stock) {
        resp = 9005;
    } else if (typeof data.stock !== 'number') {
        resp = 9004;
    }

    if (!data.category) {
        resp = 9005;
    } else if (typeof data.category !== 'string') {
        resp = 9004;
    }

    if (resp != 9099) {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }

    const all_products = new ProductsManager();
    const prod_list = all_products.editProduct(
        new_pid,
        data.title,
        data.description,
        data.code,
        data.price,
        data.status,
        data.stock,
        data.category,
        data.thumbnails
    );

    if (prod_list == 9099) {
        res.status(200).json({
            success: true,
            message: codes_translator(resp),
            data: {},
        });
    } else {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }
};

exports.deleteProduct = (req, res) => {
    const new_pid = req.params.pid;

    const all_products = new ProductsManager();
    const del_prod = all_products.deleteProduct(new_pid);

    if (del_prod == 9099) {
        res.status(200).json({
            success: true,
            message: codes_translator(resp),
            data: {},
        });
    } else {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }
};

class CartsManager {
    constructor(file_path = process.cwd(), file = carritosFile) {
        this.file_path = file_path;
        this.file = file;
        this.original_carts = {};
        this.current_id = 0;

        if (!fs.existsSync(path.join(this.file_path, this.file))) {
            try {
                fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.original_carts, null, 2));
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        }

        const read_carts = fs.readFileSync(path.join(this.file_path, this.file), 'utf-8');
        this.carts = JSON.parse(read_carts);
        this.current_id = Object.keys(this.carts)[Object.keys(this.carts).length - 1];
    }

    addCart() {
        let ids = [];
        Object.entries(this.carts).forEach((carrito) => {
            ids.push(carrito[0]);
        });

        let max = Math.max(...ids);

        if (max == '-Infinity') {
            max = 0;
        }

        let this_cart = {};

        let cid = max + 1;
        this.carts[cid] = this_cart;

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.carts, null, 2), 'utf-8', finished);
        return resp;
    }

    addItemToCart(cid, pid, qty) {
        if (this.carts[cid] == undefined) {
            resp = 9101;
            return resp;
        }

        let done = false;

        Object.entries(this.carts[cid]['products']).forEach((prod) => {
            let qtyToAdd = 0;
            if (prod[1]['product'] == pid) {
                let current_qty = this.carts[cid]['products'][0]['quantity'];
                qtyToAdd = qty + current_qty;
                this.carts[cid]['products'][0]['quantity'] = qtyToAdd;
                done = true;
            }
        });

        if (!done) {
            let new_prod = { product: Number(pid), quantity: qty };
            this.carts[cid]['products'].push(new_prod);
        }

        fs.writeFileSync(path.join(this.file_path, this.file), JSON.stringify(this.carts, null, 2), 'utf-8', finished);
        return resp;
    }
}

exports.postCart = (req, res) => {
    const data = req.body;

    const all_carts = new CartsManager();
    const cart_list = all_carts.addCart();

    if (cart_list == 9099) {
        res.status(200).json({
            success: true,
            message: codes_translator(resp),
            data: {},
        });
    } else {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }
};

exports.getCartProducts = (req, res) => {
    const all_carts = new CartsManager();
    const new_cid = req.params.cid;
    const selected_cart = all_carts.carts[new_cid];

    if (new_cid !== undefined && selected_cart !== undefined) {
        if (new_cid <= 0 || isNaN(new_cid)) {
            res.status(400).json({
                success: false,
                message: `The ID must be greater than zero and has to exist in the carts list.`,
                data: {},
            });
        } else {
            res.status(200).json({
                success: true,
                message: `Here are the products in the cart with the id ${new_cid}`,
                data: selected_cart['products'],
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: `The ID must be greater than zero and has to exist in the carts list.`,
            data: {},
        });
    }
};

exports.postProductToCart = (req, res) => {
    const data = req.body;
    const new_cid = req.params.cid;
    const new_pid = req.params.pid;

    if (new_pid != data.product) {
        resp = 9102;
    }

    if (resp != 9099) {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }

    const add_prod = new CartsManager();
    const prod_to_add = add_prod.addItemToCart(new_cid, data.product, data.quantity);

    if (prod_to_add == 9099) {
        res.status(200).json({
            success: true,
            message: codes_translator(resp),
            data: {},
        });
    } else {
        res.status(400).json({
            success: false,
            message: codes_translator(resp),
            data: {},
        });
    }
};