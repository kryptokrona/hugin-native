// Copyright (c) 2012-2017, The CryptoNote developers, The Bytecoin developers
// Copyright (c) 2014-2018, The Monero Project
// Copyright (c) 2014-2018, The Aeon Project
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

#pragma once

#include <stddef.h>

#include "CryptoTypes.h"

/* CryptoNight Turtle family definitions */
#define CN_TURTLE_PAGE_SIZE 262144
#define CN_TURTLE_SCRATCHPAD 262144
#define CN_TURTLE_ITERATIONS 131072

#pragma pack(push, 1)
union hash_state
{
    uint8_t b[200];
    uint64_t w[25];
};
#pragma pack(pop)

static_assert(sizeof(union hash_state) == 200, "Invalid structure size");

extern "C"
{
    /* tree-hash.c exports these C symbols; declare them in global scope for C++ callers */
    void tree_hash(const char (*hashes)[32], size_t count, char *root_hash);
    size_t tree_depth(size_t count);
    void tree_branch(const char (*hashes)[32], size_t count, char (*branch)[32]);
    void tree_hash_from_branch(
        const char (*branch)[32],
        size_t depth,
        const char *leaf,
        const void *path,
        char *root_hash);
}

inline void c_tree_hash(const char (*hashes)[32], size_t count, char *root_hash)
{
    ::tree_hash(hashes, count, root_hash);
}

inline size_t c_tree_depth(size_t count)
{
    return ::tree_depth(count);
}

inline void c_tree_branch(const char (*hashes)[32], size_t count, char (*branch)[32])
{
    ::tree_branch(hashes, count, branch);
}

inline void c_tree_hash_from_branch(
    const char (*branch)[32],
    size_t depth,
    const char *leaf,
    const void *path,
    char *root_hash)
{
    ::tree_hash_from_branch(branch, depth, leaf, path, root_hash);
}

namespace Crypto
{
    extern "C"
    {
#include "hash-ops.h"
    }

    void cn_fast_hash(const void *data, size_t length, char *hash);

    void cn_fast_hash(const void *data, size_t length, Hash &hash);

    Hash cn_fast_hash(const void *data, size_t length);

    inline void cn_turtle_lite_slow_hash_v2(const void *data, size_t length, Hash &hash)
    {
        cn_slow_hash(
            data,
            length,
            reinterpret_cast<char *>(&hash),
            1,
            2,
            0,
            CN_TURTLE_PAGE_SIZE,
            CN_TURTLE_SCRATCHPAD,
            CN_TURTLE_ITERATIONS);
    }

    inline void tree_hash(const Hash *hashes, size_t count, Hash &root_hash)
    {
        c_tree_hash(
            reinterpret_cast<const char(*)[HASH_SIZE]>(hashes),
            count,
            reinterpret_cast<char *>(&root_hash));
    }

    inline uint32_t tree_depth(uint32_t count)
    {
        return static_cast<uint32_t>(c_tree_depth(count));
    }

    inline void tree_branch(const Hash *hashes, size_t count, Hash *branch)
    {
        c_tree_branch(
            reinterpret_cast<const char(*)[HASH_SIZE]>(hashes), count, reinterpret_cast<char(*)[HASH_SIZE]>(branch));
    }

    inline void
    tree_hash_from_branch(const Hash *branch, size_t depth, const Hash &leaf, const void *path, Hash &root_hash)
    {
        c_tree_hash_from_branch(
            reinterpret_cast<const char(*)[HASH_SIZE]>(branch),
            depth,
            reinterpret_cast<const char *>(&leaf),
            path,
            reinterpret_cast<char *>(&root_hash));
    }
}
