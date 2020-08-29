const multipart = require('parse-multipart')
const { Octokit } = require('@octokit/rest')
const fetch = require('isomorphic-fetch')

const OWNER = 'franknoirot'
const REPO = 'franknoirot.co'
const POST_FOLDER = 'posts'

const now = new Date()
const padZ = (int, zeros) => int.toString().padStart(zeros, '0')
const date = `${now.getFullYear()}-${padZ(now.getMonth(), 2)}-${padZ(now.getDate(), 2)}`

function postMeta(title, slug, categories) {
    return `---\ntitle: "${ title }"\nslug: "${ slug }"\nlayout: "layouts/post.njk"\ndate: ${ now.toISOString() }\ntags:\n  - post\n${  categories.map(c => '  - '+c) }\n---\n\n`
}

exports.handler = async function (event, context, callback) {
    if (event.method === 'OPTIONS') {
        callback(null, {
            statusCode: 200,
            headers: {
                'Control-Access-Allow-Origin': '*',
            }
        })
    }

    try {
        console.log('event.body = ', event.body)

        console.log('event.headers', JSON.stringify(event.headers, null, 2))

        // uhh Netlify Identity just comes for free with the request????
        console.log('context', JSON.stringify(context, null, 2))

        const authRes = await fetch('https://tokens.indieauth.com/#verify', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer '+ event.headers.cookie
            },
        })

        console.log('res = ', authRes)

        console.log('user = ', user)

        // if invalid user, return failure state
        const tests = [!user, !user.hasOwnProperty('me'), !user.me, event.body.type.indexOf('h-entry') < 0, !event.body.hasOwnProperty('content'), !event.body.content]

        if (tests.some(test => test)) {
            console.log(JSON.stringify(tests), null, 2)
            callback(new Error("malformed authentication"), {
                statusCode: 403,
                body: "Forbidden: malformed authentication",
            })

            return 
        }

        // if valid user, add contents to GitHub repo as a Markdown (or HTML) file
        const octo = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        })

        let title = event.body.name[0]
        if (!title) {
            title = event.body.content[0].html.match(/<h1>(.*)<\/h1>/)
        }
        
        if (title) {
            title = title[1]
            event.body.content[0].html = event.body.content[0].html.replace(/<h1>(.*)<\/h1>/, '')
        } else {
            title = `Post ${date}`
        }

        parts.content = postMeta(title, event.body["mp-slug"], event.body.category) + event.body.content[0].html

        const filePath = POST_FOLDER + '/' + ((event.body["mp-slug"]) ? event.body["mp-slug"] + '.md' : `${date}--${now.getHours}-${now.getMinutes}-${now.getSeconds}.md`)

        console.log(event.body.content[0].html)

        // push commit to GitHub repo
        await uploadToRepo(octo, title, filePath, event.body.content[0].html, OWNER, REPO)

        callback(null, {
            statusCode: 201,
            body: 'Post created! Site rebuilding',
        })
    } catch(err) {
        console.error(err)
        callback(err, {
            statusCode: 502,
            body: JSON.stringify(err),
        })
    }
} 

async function uploadToRepo(octo, path, content, owner, repo, branch = `master`) {
    const currCommit = await getCurrCommit(octo, owner, repo, branch)
    const fileBlob = await createBlobForFile(octo, content, owner, repo)
    console.log('fileBlob = ', fileBlob)
    const newTree = await createNewTree(
        octo,
        owner,
        repo,
        fileBlob,
        path,
        currCommit.treeSha
    )
    console.log('newTree = ', newTree)
    const commitMessage = `New post published via MicroPub: ${ title }`
    const newCommit = await createNewCommit(
        octo,
        owner,
        repo,
        commitMessage,
        newTree.sha,
        currCommit.commitSha,
    )
    console.log('newCommit = ', newCommit)

    await setBranchToCommit(octo, owner, repo, branch, newCommit.sha)
    console.log('Done!')
}

async function getCurrCommit(octo, owner, repo, branch = `master`) {
    const { data: refData } = await octo.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
    })
    const commitSha = refData.object.sha
    const { data: commitData } = await octo.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
    })
    return {
        commitSha,
        treeSha: commitData.tree.sha,
    }
}

async function createBlobForFile(octo, content, owner, repo) {
    const blobData = await octo.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'utf-8',
    })
    return blobData.data
}

async function createNewTree(octo, owner, repo, blob, path, parentTreeSha) {
    const tree = [{
        path,
        mode: `100644`,
        type: `blob`,
        sha: blob.sha,
    }]
    const { data } = await octo.git.createTree({
        owner,
        repo,
        tree,
        base_tree: parentTreeSha,
    })
    return data
}

async function createNewCommit(octo, owner, repo, message, currTreeSha, currCommitSha) {
    return (await octo.git.createCommit({
        owner,
        repo,
        message,
        tree: currTreeSha,
        parents: [currCommitSha],
    })).data
}

function setBranchToCommit(octo, owner, repo, branch = `master`, commitSha) {
    octo.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commitSha,
    })
}