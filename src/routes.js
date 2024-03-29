const express = require('express');
const router = express.Router();
const { getProducts, getProduct, postProduct, putProduct, deleteProduct, postCart, getCartProducts, postProductToCart } = require('./productManager');

router.route('/products').get(getProducts);
router.route('/products/:pid').get(getProduct);
router.route('/products').post(postProduct);
router.route('/products/:pid').put(putProduct);
router.route('/products/:pid').delete(deleteProduct);
router.route('/carts').post(postCart);
router.route('/carts/:cid').get(getCartProducts);
router.route('/carts/:cid/product/:pid').post(postProductToCart);

module.exports = router;